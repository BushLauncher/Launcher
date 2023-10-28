import Window from './Window';
import { URL } from 'url';
import path from 'path';
import { currentWindow, getConfigManager, getDataStorage, isDev } from './main';
import { app, ipcMain, net } from 'electron';
import { Callback, CallbackType, GameType, GameVersion, RawLaunchProcess } from '../types/Versions';
import * as versionManager from './VersionManager';
import { getAllVersionList, getSelectedVersion, getVersionMethode, groupMinecraftVersions } from './VersionManager';
import * as userData from './DataManager';
import { CleanUpCatch } from './DataManager';
import { UninstallGameFiles, VerifyVersionFile } from './FileManager';
import { AuthProviderType, MinecraftAccount } from '../types/AuthPublic';
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
} from './AuthModule';
import { KnownAuthErrorType } from '../types/Errors';
import {
  getDefaultRootPath,
  getLocationRoot,
  Launch,
  RegisterRunningVersion,
  RunningVersionList,
  StopGame,
  UnregisterRunningVersion
} from './Core';
import { Configuration } from '../types/Configuration';
import { defaultData } from '../types/Storage';
import { Themes } from '../types/Theme';
import { DeleteJava } from './JavaEngine';
import ConsoleManager, { ProcessType } from '../global/ConsoleManager';


export default class MainWindow extends Window {
  constructor() {
    super({ contentPath: resolveHtmlPath('index.html') });
    const console = new ConsoleManager('Main windows', ProcessType.Internal);

    //register IPC events
    ipcMain.handle('Version:getList', (_event, { gameType, type, grouped = false }: {
      gameType: GameType | undefined, type?: getVersionMethode, grouped?: boolean,
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
        })); else resolve(grouped ? groupMinecraftVersions(versionManager.getLocalVersionList(gameType)) : versionManager.getLocalVersionList(gameType));
      });
    });
    ipcMain.handle('Version:getTypeList', (_event) => {
      return Object.keys(GameType);
    });
    ipcMain.handle('Version:getSelected', (_event, args: { configId: string }) => {
      return getSelectedVersion(args.configId);
    });
    ipcMain.on('Version:set', (_event, args: { version: GameVersion, configuration: string }) => {
      return userData.SelectVersion(args.version, args.configuration);
    });

    ipcMain.handle('VersionManager:Uninstall', async (_event, args: { version: GameVersion, path?: string }) => {
      return await UninstallGameFiles(args.version, args.path, (callback) => _event.sender.send('VersionManager:Uninstall', callback));
    });
    ipcMain.handle('VersionManager:Diagnose', async (_event, args: { version: GameVersion, path?: string }) => {
      const path = args.path || '';
      //TODO: resolve in all instances
      return await VerifyVersionFile(args.version, path);
    });

    ipcMain.handle('Auth:Add', (_event, args: { user: MinecraftAccount }) => {
      return AddAccount(args.user);
    });
    ipcMain.handle('Auth:checkAccount', (_event, args: { user: MinecraftAccount }) => {
      return isAccountValid(args.user);
    });
    ipcMain.handle('Auth:refreshUser', async (_event, args: { userId: number | MinecraftAccount }) => {
      const response = await RefreshAccount(args.userId);
      const id = (typeof args.userId === 'number') ? args.userId : resolveUserId(args.userId);
      if (response !== KnownAuthErrorType.CannotRefreshAccount) ReplaceAccount(id, response);
      //return response (can contain the Error)
      return response;
    });
    ipcMain.handle('Auth:LogOut', (_event, args: { accountIndex: number }) => {
      return LogOutAccount(args.accountIndex);
    });
    ipcMain.handle('Auth:LogOutAll', (_event, args: { accountIndex: number }) => {
      return LogOutAllAccount();
    });
    ipcMain.handle('Auth:getSelectedAccount', () => getSelectedAccount());
    ipcMain.handle('Auth:getSelectedId', () => {
      return getSelectedAccountId();
    });
    ipcMain.handle('Auth:getAccountList', () => getAccountList());
    ipcMain.handle('Auth:Login', async (_event, args: { type: AuthProviderType }) => {
      return new Promise<MinecraftAccount>((resolve, reject) => {
        Login(args.type).then(res => resolve(res)).catch(err => {
          console.log(err);
          resolve(err);
        });
        //reject will not pass err and return string [Object object]

      });
    });
    ipcMain.on('Auth:SelectAccount', (_event, args: { index: number }) => SelectAccount(args.index));
    ipcMain.handle('GameEngine:RequestLaunch', (_event, request_args: { id: string }) => {
      //Register all IPC functions
      ipcMain.handle('GameEngine:Launch:' + request_args.id, async (_event, args: {
        LaunchProcess: RawLaunchProcess
      }) => {
        try {
          const runningIndex = RegisterRunningVersion(args.LaunchProcess);
          const operation = Launch(args.LaunchProcess, (callback: Callback) => {
            _event.sender.send('GameLaunchCallback:' + args.LaunchProcess.id, callback);
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

    ipcMain.handle('GameEngine:getRootPath', (_event) => {
      return getLocationRoot();
    });
    ipcMain.handle('GameEngine:getDefaultRootPath', (_event) => {
      return getDefaultRootPath();
    });
    ipcMain.handle('GameEngine:getRunningList', (_event) => {
      //must reencode list because we cant pass process Class
      return RunningVersionList.map(rv => {
        return { ...rv, process: null };
      });
    });
    ipcMain.handle('GameEngine:KillProcess', (_event, args: { processId: string }) => {
      return StopGame(args.processId);
    });
    ipcMain.handle('Option:setRootPath', (_event, args: { path: string }) => {
      return userData.SetRootPath(args.path);
    });
    ipcMain.handle('Option:setTheme', (_event, arg: { theme: Themes }) => {
      getDataStorage().update("interface.theme", arg.theme);
    });
    ipcMain.handle('Configs:Add', (_event, args: { configuration: Configuration }) => {
      return getConfigManager().add(args.configuration);
    });
    ipcMain.handle('Configs:Remove', (_event, args: { configurationId: string }) => {
      return getConfigManager().remove(args.configurationId);
    });
////////////////////////////////////////////////////////
    ipcMain.handle('getData', (_event, args: { dataPath: string }) => {
      return getDataStorage().get(args.dataPath);
    });
    ipcMain.handle('Storage:DeleteAll', async (_event) => {
      DeleteJava();
      getDataStorage().DeleteFile();
      CleanUpCatch();
      currentWindow?.window?.webContents.session.flushStorageData();
      currentWindow?.window?.webContents.session.clearStorageData().then(() => {
        app.exit();
        app.relaunch();
      });
    });
    ipcMain.handle('Storage:DeleteJava', (_event) => {
      return DeleteJava();
    });

    ipcMain.handle('Storage:CleanCatch', (_event) => {
      return CleanUpCatch();
    });

  }
}


export function resolveHtmlPath(htmlFileName: string) {
  if (isDev) {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  } else return path.join(__dirname, '../renderer/', htmlFileName);
}
