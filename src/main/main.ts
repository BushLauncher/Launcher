/* eslint global-require: off, no-console: off, promise/always-return: off */
import { app, BrowserWindow, ipcMain } from 'electron';
import { installExtensions } from './extension-installer';
import MainWindow from './MainWindow';
import ConsoleManager, { ProcessType } from '../global/ConsoleManager';
import * as userData from './DataManager';
import { defaultUserPreferences, Storage } from './DataManager';
import { getAccountList, getSelectedAccount, isAccountValid, RefreshAccount, ReplaceAccount } from './AuthModule';
import { MinecraftAccount } from '../types/AuthPublic';
import { ConfigurationManager } from './ConfigsManager';
import { KnownAuthErrorType } from '../types/Errors';
import ProgressBarOptions = Electron.ProgressBarOptions;


const console = new ConsoleManager('Main', ProcessType.Internal);
export const isDev = process.env.NODE_ENV === 'development';
export const isDebug = isDev || process.env.DEBUG_PROD === 'true';
export let currentWindow: MainWindow | null = null;
let DataStorage: Storage | null = null;
let ConfigManager: ConfigurationManager | null = null;

export function getDataStorage(): Storage {
  if (DataStorage === null) throw new Error('Storage not initialized');
  else return DataStorage;
}

export function getConfigManager(): ConfigurationManager {
  if (ConfigManager === null) throw new Error('Config manager isn\'t initialized');
  else return ConfigManager;
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (isDebug) require('electron-debug')();

export function QuitApp() {
  currentWindow?.window?.webContents.send('clearAll');
  app.quit();
}

app.on('window-all-closed', () => app.quit());

ipcMain.on('App:Close', (_event) => QuitApp());
ipcMain.on('App:Minimize', (_event) => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.on('App:Relaunch', (_event) => {
  app.relaunch();
  QuitApp();
});
/**
 * Used in preload
 */
ipcMain.handle('App:getVersion', (_event) => app.getVersion());
ipcMain.on('App:setWinBar', (e, args: { percentage: number, options?: ProgressBarOptions }) => {
  if (currentWindow !== null) currentWindow.window.setProgressBar((args.percentage / 100), args.options);
});

/*app.whenReady()
  .then(async () => {
    if (isDebug) await installExtensions();
    let preloadWindow: PreloadWindow | null = new PreloadWindow();
    preloadWindow?.window.on('closed', () => preloadWindow = null);
    currentWindow = preloadWindow?.window;
    preloadWindow?.window.on('ready-to-show', () => {
      preloadWindow?.show();
      preloadWindow?.Run()
        .then((mustRestart) => {
          if (mustRestart) app.quit(); else {
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
*/

async function _Start() {
  await app.whenReady();
  if (isDebug) {
    console.warn('>Running in debug mode<');
    installExtensions().then(() => console.log('Loaded dev extensions')).catch(e => console.error('Cannot load dev extensions\n', e));
  }
  console.log('Starting...');
  currentWindow = new MainWindow();
  if (isDebug) console.log('Showing main window');
  currentWindow?.show();

  //Running loading operations
  //@ Check for update

  //Load files
  //initialise storage
  DataStorage = new userData.Storage('user-preference', defaultUserPreferences);
  ConfigManager = new ConfigurationManager();

  //Put in a function to be able to call it on browser reload
  function Load() {
    function SendWhenLoaded(channel: string, value: any) {
      currentWindow?.window.webContents.send(channel, value);
      currentWindow?.window.webContents.on('dom-ready', () => {
        currentWindow?.window.webContents.send(channel, value);
      });
    }

    console.log('Loading web-related content...');
    //Check account
    const potentialAccount: MinecraftAccount | null = getSelectedAccount();
    if (potentialAccount === null) SendWhenLoaded('Starting:AccountCheckOperation', 'mustLogin');
    else {
      if (isAccountValid(potentialAccount)) SendWhenLoaded('Starting:AccountCheckOperation', 'done');
      else {
        //trying to validate
        console.log('Refreshing account ' + potentialAccount.profile.name + '...');
        SendWhenLoaded('Starting:AccountCheckOperation', 'validating');
        RefreshAccount(potentialAccount).then(response => {
          if (response === KnownAuthErrorType.CannotRefreshAccount) SendWhenLoaded('Starting:AccountCheckOperation', 'couldntRevalidate');
          else {
            const index = getAccountList().findIndex(a => a === potentialAccount);
            if (index === -1) throw new Error('Cannot find account to replace');
            else {
              ReplaceAccount(index, response);
              SendWhenLoaded('Starting:AccountCheckOperation', 'done');
            }
          }

        });
      }
    }
    const mustLogin: boolean = potentialAccount ? !isAccountValid(potentialAccount) : true;
    //wait for frontend listeners registered
    currentWindow?.window.webContents.on('did-finish-load', () => {
      currentWindow?.window.webContents.send('Starting:AccountCheckOperation', mustLogin);
    });

    //parse configs
    const configList = getConfigManager().getAll();
    //wait for frontend listeners registered
    currentWindow?.window.webContents.on('did-finish-load', () => currentWindow?.window.webContents.send('Starting:ConfigurationsReceive', configList));
  }

  Load();

  //After all loaded, handle a (re) Load() when dom reload
  currentWindow.window.once('ready-to-show', () => currentWindow?.window.webContents.on('dom-ready', () => Load()));
}

// noinspection JSIgnoredPromiseFromCall
_Start();
