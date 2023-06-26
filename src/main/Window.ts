import { app, BrowserWindow } from 'electron';
import path from 'path';
import BrowserWindowConstructorOptions = Electron.BrowserWindowConstructorOptions;

export interface windowConstructor {
  contentPath: string;
  additionalParams?: BrowserWindowConstructorOptions;
}

export default class Window {
  public window!: BrowserWindow;

  constructor({ additionalParams, contentPath }: windowConstructor) {
    const params = Object.assign(<BrowserWindowConstructorOptions>{
      show: false,
      type: '',
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
      // noinspection SpellCheckingInspection
      fullscreenable: false,
      transparent: false,
      hasShadow: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#232323',
      backgroundMaterial: "acrylic",
      frame: false,
      movable: true,
      minimizable: true,
      maximizable: false,
      closable: true,
      title: 'Bush Launcher',
      darkTheme: true,
      icon: this.getAssetPath('icon.png'),
    }, additionalParams);
    this.window = new BrowserWindow(params);
    this.window.setResizable(false);
    const resolvedHtmlPath = contentPath;
    console.log(resolvedHtmlPath);
    const loadingOperation = (contentPath.startsWith('http'))
      ? this.window.webContents.loadURL(resolvedHtmlPath)
      : this.window.loadFile(resolvedHtmlPath);
    loadingOperation.then(() => {
      return;
    });
  }

  show() {
    this.window?.show();
  }

  close() {
    this.window?.close();
  }

  private getAssetPath(...dataPaths: string[]) {
    return path.join(app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets'), ...dataPaths);
  }
}
