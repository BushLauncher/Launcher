/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, ipcMain, net, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-extension-installer';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

import PreLoad from './load/load';
import { update } from './downloader';
import * as versionManager from '../internal/VersionManager';
import { GetAllVersionList, getSelectedVersion } from '../internal/VersionManager';
import * as userData from '../internal/UserData';
import {
  Callback,
  GameType,
  PreLaunchProcess,
  PreLaunchRunnableProcess,
  VersionData
} from '../internal/public/GameData';
import {
  AddAccount,
  getAccountList,
  getSelectedAccount,
  getSelectedAccountId,
  Login,
  LogOutAccount,
  LogOutAllAccount,
  SelectAccount
} from '../internal/AuthModule';
import { AuthProviderType, MinecraftAccount } from '../internal/public/AuthPublic';
import { getLocationRoot, RunPreLaunchProcess } from '../internal/Launcher';
import { getLaunchInternal } from '../internal/PreLaunchProcessPatern';

const prefix = '[Main Process]: ';
const createWindow = async () => {
  return new Promise(async (resolve, reject) => {
    const RESOURCES_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../assets');

    const getAssetPath = (...dataPaths: string[]): string => {
      return path.join(RESOURCES_PATH, ...dataPaths);
    };

    // noinspection SpellCheckingInspection
    mainWindow = new BrowserWindow({
      show: false,
      width: 1080,
      height: 670,
      minWidth: 1080,
      minHeight: 670,
      center: true,
      webPreferences: {
        disableHtmlFullscreenWindowResize: true,
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js')
      },
      fullscreenable: false,
      titleBarStyle: 'hidden',
      transparent: true,
      frame: false,
      movable: true,
      minimizable: true,
      maximizable: false,
      closable: true,
      title: 'Bush Launcher',
      darkTheme: true,
      icon: getAssetPath('icon.png')
    });
    mainWindow.setResizable(false);
    mainWindow.webContents
      .loadFile('./src/main/load/mainLoad.html')
      .then(() => {
        console.log('executing js...');
        const tempPath = app.getPath('temp').replaceAll('\\', '/');
        const modifyMainText = (text: string) => {
          if (mainWindow !== null) {
            mainWindow.webContents.executeJavaScript(
              `try{document.querySelector('#state').innerText = "${text}";}catch(err) {console.error("we couldn't set the text from the main process");console.error(err)}`
            );
          }
        };
        new PreLoad(modifyMainText, tempPath)
          .run()
          .then(async (response) => {
            const installUpdate = async (toDownload: any) => {
              update(toDownload, (text: string) => modifyMainText(text)).then(
                (update: any) => {
                  if (update.updated) {
                    modifyMainText('Restarting...');
                    resolve({ mustRestart: true });
                    //must restart
                  } else {
                    console.error(prefix + update);
                  }
                }
              );
            };
            if (response.skipped == true) {
              //offline mode
              modifyMainText('Starting Offline mode...');
              console.log(prefix + 'Starting offline mode');
              resolve({ mustRestart: false });
            } else {
              if (response.exist) {
                await installUpdate(response);
              } else {
                console.log(prefix + 'No update available !, starting...');
                modifyMainText('Starting...');
                //continue loading this version
                resolve({ mustRestart: false });
              }
            }
          })
          .catch((err) => console.error(err));
      });

    mainWindow.on('ready-to-show', () => {
      if (!mainWindow) throw new Error('"mainWindow" is not defined');
      //prevent next/previous mouse button
      mainWindow.webContents.executeJavaScript(
        'window.addEventListener("mouseup", (e) => {\n' +
        '   if (e.button === 3 || e.button === 4)\n' +
        '      e.preventDefault();\n' +
        '});'
      );
      if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
      shell.openExternal(edata.url);
      return { action: 'deny' };
    });


    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater();
  });
};

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});
app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
/**
 * Add event listeners...
 */

ipcMain.on('closeApp', (event, args) => app.quit());
ipcMain.on('minimizeWindow', (event, args) =>
  BrowserWindow.getFocusedWindow()?.minimize()
);
ipcMain.handle('Version:getList', (event, args: { gameType: GameType | undefined }) => {
  return new Promise(async (resolve, reject) => {
    if (args.gameType === undefined) {
      resolve(await GetAllVersionList());
      return;
    }
    if (net.isOnline()) resolve(await versionManager.GetVersionList(args.gameType).catch((err) => {
      console.error(err);
      reject(err);
    }));
    else resolve(versionManager.GetLocalVersionList(args.gameType));
  });
});
ipcMain.handle('Version:get', (event, args) => {
  return getSelectedVersion();
});
ipcMain.on('Version:set', (event, version: VersionData) => {
  return userData.SelectVersion(version);
});

ipcMain.handle('Auth:Add', (event, args: { user: MinecraftAccount }) => {
  return AddAccount(args.user);
});
ipcMain.handle('Auth:LogOut', (event, args: { accountIndex: number }) => {
  return LogOutAccount(args.accountIndex);
});
ipcMain.handle('Auth:LogOutAll', (event, args: { accountIndex: number }) => {
  return LogOutAllAccount();
});
ipcMain.handle('Auth:getSelectedAccount', () => getSelectedAccount());
ipcMain.handle('Auth:getSelectedId', () => {
  return getSelectedAccountId();
});
ipcMain.handle('Auth:getAccountList', () => getAccountList());
ipcMain.handle(
  'Auth:Login',
  async (event, args: { type: AuthProviderType }) => {
    return new Promise<MinecraftAccount>((resolve, reject) => {
      Login(args.type).then(res => resolve(res)).catch(err => {
        console.log(err);
        resolve(err);
      });
      //reject will not pass err and return string [Object object]

    });
  }
);
ipcMain.on('Auth:SelectAccount', (event, args: { index: number }) =>
  SelectAccount(args.index)
);

ipcMain.handle('GameEngine:Launch', async (event, args: {
  LaunchProcess: PreLaunchProcess | PreLaunchRunnableProcess | undefined
}) => {
  const process = args.LaunchProcess === undefined ? getLaunchInternal() : args.LaunchProcess;
  return RunPreLaunchProcess(process,
    (callback: Callback) => {
      event.sender.send('GameLaunchCallback', callback);
      //console.log(callback);
    })
    .catch(err => {
      console.error(err);
      return err;
    });


  //reject will not pass err and return string [Object object]

});

ipcMain.handle('GameEngine:getRootPath', (event, args) => {
  return getLocationRoot();
});
////////////////////////////////////////////////////////

export const userDataStorage = new userData.Storage('user-preference');
ipcMain.on('saveData', (event, arg: { dataPath: string; value: any }) => {
  userDataStorage.set(arg.dataPath, arg.value);
});
ipcMain.handle('getData', (event, args: { dataPath: string }) => {
  return userDataStorage.get(args.dataPath);
});
ipcMain.on('updateData', (event, arg: { value: any; dataPath: any }) => {
  userDataStorage.update(arg.dataPath, arg.value);
});
ipcMain.handle('removeData', (event, arg: { dataPath: string }) => {
  return userDataStorage.remove(arg.dataPath);
});
ipcMain.handle('deleteAll', (event) => {
  return userDataStorage.DeleteFile();
});
////////////////////////////////////////////////////////
app
  .whenReady()
  .then(async () => {
    if (isDebug) {
      await installExtension(REACT_DEVELOPER_TOOLS, {
        loadExtensionOptions: { allowFileAccess: true }
      });
    }
    createWindow().then((res: any) => {
      if (res.mustRestart) app.quit();
      userData.loadData();
      setTimeout(() => {
        if (mainWindow !== null)
          mainWindow.loadURL(resolveHtmlPath('index.html')).then(async () => {
          });
      }, /*5000*/ 0);
      //INSUPPORTABLE
    });
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
