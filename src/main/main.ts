/* eslint global-require: off, no-console: off, promise/always-return: off */
// noinspection JSUnusedLocalSymbols

import * as userData from './internal/UserData';
import { CleanUpCatch } from './internal/UserData';
import { app, BrowserWindow, ipcMain, net } from 'electron';
import * as versionManager from './internal/VersionManager';
import {
  getAllVersionList,
  getSelectedVersion,
  getVersionMethode,
  groupMinecraftVersions
} from './internal/VersionManager';
import { Callback, CallbackType, GameType, GameVersion, RawLaunchProcess } from '../public/GameDataPublic';
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
  resolveUserId,
  SelectAccount
} from './internal/AuthModule';
import { AuthProviderType, MinecraftAccount } from '../public/AuthPublic';
import {
  getDefaultRootPath,
  getLocationRoot,
  Launch,
  RegisterRunningVersion,
  RunningVersionList,
  StopGame,
  UnregisterRunningVersion
} from './internal/Core';
import { UninstallGameFiles, VerifyVersionFile } from './internal/FileManager';
import { KnownAuthErrorType } from '../public/ErrorPublic';
import { installExtensions } from './extension-installer';
import PreloadWindow from './PreloadWindow';
import MainWindow from './MainWindow';
import { DeleteJava } from './internal/JavaEngine';
import ConsoleManager, { ProcessType } from '../public/ConsoleManager';
import ProgressBarOptions = Electron.ProgressBarOptions;

const console = new ConsoleManager('Main', ProcessType.Internal);


export let currentWindow: BrowserWindow | null = null;
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
function quitApp() {
  currentWindow?.webContents.send('clearAll');
  app.quit();
}

ipcMain.on('App:Close', (event, args) => {

  quitApp();
});
ipcMain.on('App:Minimize', (event, args) => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.on('App:Relaunch', (event, args) => {
  app.relaunch();
  quitApp();
});
ipcMain.handle('App:getVersion', (event, args) => app.getVersion());

ipcMain.handle('Version:getList', (event, { gameType, type, grouped = false }: {
  gameType: GameType | undefined,
  type?: getVersionMethode,
  grouped?: boolean,
}) => {
  return new Promise(async (resolve, reject) => {
    type = type || 'auto';
    if (gameType === undefined) {
      resolve(grouped ? groupMinecraftVersions(await getAllVersionList(type)) : await getAllVersionList(type));
      return;
    }
    if ((type === 'network' || type === 'auto') && net.isOnline()) resolve(grouped ? groupMinecraftVersions(await versionManager.getVersionList(gameType)) : await versionManager.getVersionList(gameType).catch((err) => {
      console.error(err);
      reject(err);
    }));
    else resolve(grouped ? groupMinecraftVersions(versionManager.getLocalVersionList(gameType)) : versionManager.getLocalVersionList(gameType));
  });
});
ipcMain.handle('Version:getTypeList', (event, args) => {
  return Object.keys(GameType);
});
ipcMain.handle('Version:get', (event, args) => {
  return getSelectedVersion();
});
ipcMain.on('Version:set', (event, args: { version: GameVersion }) => {
  return userData.SelectVersion(args.version);
});

ipcMain.handle('VersionManager:Uninstall', async (event, args: { version: GameVersion, path?: string }) => {
  return await UninstallGameFiles(args.version, args.path, (callback) => event.sender.send('VersionManager:Uninstall', callback));
});
ipcMain.handle('VersionManager:Diagnose', async (event, args: { version: GameVersion, path?: string }) => {
  const path = args.path || '';
  //TODO: resolve in all instances
  return await VerifyVersionFile(args.version, path);
});

ipcMain.handle('Auth:Add', (event, args: { user: MinecraftAccount }) => {
  return AddAccount(args.user);
});
ipcMain.handle('Auth:checkAccount', (event, args: { user: MinecraftAccount }) => {
  return isAccountValid(args.user);
});
ipcMain.handle('Auth:refreshUser', async (event, args: { userId: number | MinecraftAccount }) => {
  const response = await RefreshAccount(args.userId);
  const id = (typeof args.userId === 'number') ? args.userId : resolveUserId(args.userId);
  if (response !== KnownAuthErrorType.CannotRefreshAccount) ReplaceAccount(id, response);
  //return response (can contain the Error)
  return response;
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
ipcMain.handle('GameEngine:RequestLaunch', (event, request_args: { id: string }) => {
  //Register all IPC functions
  ipcMain.handle('GameEngine:Launch:' + request_args.id, async (event, args: { LaunchProcess: RawLaunchProcess }) => {
    try {
      const runningIndex = RegisterRunningVersion(args.LaunchProcess);
      const operation = Launch(args.LaunchProcess, (callback: Callback) => {
        event.sender.send('GameLaunchCallback:' + args.LaunchProcess.id, callback);
        if (callback.type === CallbackType.Exited) {
          UnregisterRunningVersion(args.LaunchProcess.id);
          return;
        }
      }, runningIndex);
      operation.then(e => {
        ipcMain.removeHandler('GameEngine:Launch:' + request_args.id);
        if (RunningVersionList.findIndex(rv => rv.id === request_args.id) !== -1) UnregisterRunningVersion(args.LaunchProcess.id);
      });
      return await operation;
    } catch (err) {
      console.raw.error(err);
      return err;
    }
    //reject will not pass err and return string [Object object]

  });
});

ipcMain.handle('GameEngine:getRootPath', (event, args) => {
  return getLocationRoot();
});
ipcMain.handle('GameEngine:getDefaultRootPath', (event, args) => {
  return getDefaultRootPath();
});
ipcMain.handle('GameEngine:getRunningList', (event, args) => {
  //must reencode list because we cant pass process Class
  return RunningVersionList.map(rv => {
    return { ...rv, process: null };
  });
});
ipcMain.handle('GameEngine:KillProcess', (event, args: { processId: string }) => {
  return StopGame(args.processId);
});
ipcMain.handle('Option:setRootPath', (event, args: { path: string }) => {
  return userData.SetRootPath(args.path);
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
ipcMain.handle('Storage:DeleteAll', async (event) => {
  DeleteJava();
  userDataStorage.DeleteFile();
  CleanUpCatch();
  currentWindow?.webContents.session.flushStorageData();
  currentWindow?.webContents.session.clearStorageData().then(() => {
    app.exit();
    app.relaunch();
  });
});
ipcMain.handle('Storage:DeleteJava', (event) => {
  return DeleteJava();
});

ipcMain.handle('Storage:CleanCatch', (event) => {
  return CleanUpCatch();
});


////////////////////////////////////////////////////////
ipcMain.on('App:setWinBar', (e, args: { percentage: number, options?: ProgressBarOptions }) => {
  if (currentWindow !== null) currentWindow.setProgressBar((args.percentage / 100), args.options);
});
////////////////////////////////////////////////////////
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-proxy-server');
app
  .whenReady()
  .then(async () => {
    if (isDebug) await installExtensions();
    let preloadWindow: PreloadWindow | null = new PreloadWindow();
    preloadWindow?.window.on('closed', () => preloadWindow = null);
    currentWindow = preloadWindow?.window;
    preloadWindow?.window.on('ready-to-show', () => {
      preloadWindow?.show();
      preloadWindow?.Run()
        .then((mustRestart) => {
          if (mustRestart) app.quit();
          else {
            preloadWindow?.modifyMainText('Loading data...');
            userData.loadData();
            preloadWindow?.modifyMainText('Launching...');
            const mainWindow = new MainWindow();
            currentWindow = mainWindow.window;
            mainWindow.window.on('ready-to-show', () => {
              setTimeout(() => {
                mainWindow.show();
                preloadWindow?.close();
              }, isDebug ? 0 : 5000);
            });

          }
        }).catch(err => {
        console.error(err);
      });
    });
  })
  .catch(console.log);
