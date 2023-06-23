/* eslint global-require: off, no-console: off, promise/always-return: off */
import path from 'path';
import { app, BrowserWindow, ipcMain, net, shell } from 'electron';
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-extension-installer';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

import PreLoad from './load/load';
import { Update } from './downloader';
import * as versionManager from '../internal/VersionManager';
import { getAllVersionList, getSelectedVersion, getVersionMethode } from '../internal/VersionManager';
import * as userData from '../internal/UserData';
import { SetRootPath } from '../internal/UserData';
import {
  Callback,
  GameType,
  GameVersion,
  PreLaunchProcess,
  PreLaunchRunnableProcess
} from '../internal/public/GameDataPublic';
import {
  AddAccount,
  getAccountList,
  getSelectedAccount,
  getSelectedAccountId,
  isAccountValid,
  Login,
  LogOutAccount,
  LogOutAllAccount,
  RefreshAccount,
  ReplaceAccount,
  SelectAccount
} from '../internal/AuthModule';
import { AuthProviderType, MinecraftAccount } from '../internal/public/AuthPublic';
import { getDefaultRootPath, getLocationRoot, RunPreLaunchProcess } from '../internal/Launcher';
import { getLaunchInternal } from '../internal/PreLaunchProcessPatern';
import { InstallGameFiles, UninstallGameFiles, VerifyGameFiles } from '../internal/GameFileManager';
import { KnownAuthErrorType } from '../internal/public/ErrorPublic';

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
              Update(toDownload, (text: string) => modifyMainText(text)).then(
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

  });
};

export let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}
///////////////////////////////////

ipcMain.on('App:Close', (event, args) => app.quit());
ipcMain.on('App:Minimize', (event, args) => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.on('App:Relaunch', (event, args) => {
  app.relaunch();
  app.quit();
});

ipcMain.handle('Version:getList', (event, { gameType, type }: {
  gameType: GameType | undefined,
  type?: getVersionMethode
}) => {
  return new Promise(async (resolve, reject) => {
    if (type === undefined) type = 'auto';
    if (gameType === undefined) {
      resolve(await getAllVersionList(type));
      return;
    }
    if ((type === 'network' || type === 'auto') && net.isOnline()) resolve(await versionManager.getVersionList(gameType).catch((err) => {
      console.error(err);
      reject(err);
    }));
    else resolve(versionManager.getLocalVersionList(gameType));
  });
});
ipcMain.handle('Version:getTypeList', (event, args) => {
  return Object.keys(GameType);
});
ipcMain.handle('Version:get', (event, args) => {
  return getSelectedVersion();
});
ipcMain.on('Version:set', (event, version: GameVersion) => {
  return userData.SelectVersion(version);
});

ipcMain.handle('VersionManager:Uninstall', async (event, args: { version: GameVersion, path?: string }) => {
  return await UninstallGameFiles(args.version, args.path, (callback) => event.sender.send('VersionManager:Uninstall', callback));
});
ipcMain.handle('VersionManager:Diagnose', async (event, args: { version: GameVersion, path?: string }) => {
  return await VerifyGameFiles(args.version, args.path);
});
ipcMain.handle('VersionManager:Install', async (event, args: { version: GameVersion }) => {
  return await InstallGameFiles(args.version, (callback) => event.sender.send('VersionManager:Install', callback));
});

ipcMain.handle('Auth:Add', (event, args: { user: MinecraftAccount }) => {
  return AddAccount(args.user);
});
ipcMain.handle('Auth:checkAccount', (event, args: { user: MinecraftAccount }) => {
  return isAccountValid(args.user);
});
ipcMain.handle('Auth:refreshUser', async (event, args: { userId: number }) => {
  const resolvedUser = getAccountList()[args.userId];
  const newAccount = await RefreshAccount(resolvedUser);
  if (newAccount === KnownAuthErrorType.CannotRefreshAccount) return newAccount;
  return ReplaceAccount(args.userId, newAccount);
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
ipcMain.handle('Auth:Login', async (event, args: { type: AuthProviderType }) => {
  return new Promise<MinecraftAccount>((resolve, reject) => {
    Login(args.type).then(res => resolve(res)).catch(err => {
      console.log(err);
      resolve(err);
    });
    //reject will not pass err and return string [Object object]

  });
});
ipcMain.on('Auth:SelectAccount', (event, args: { index: number }) => SelectAccount(args.index));

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
ipcMain.handle('GameEngine:getDefaultRootPath', (event, args) => {
  return getDefaultRootPath();
});
ipcMain.handle('Option:setRootPath', (event, args: { path: string }) => {
  return SetRootPath(args.path);
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

    createWindow()
      .then((res: any) => {
        if (res.mustRestart) app.quit();
        userData.loadData();
        if (mainWindow !== null)
          mainWindow.loadURL(resolveHtmlPath('index.html'));
      });
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
