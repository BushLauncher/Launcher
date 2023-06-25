// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
const { contextBridge, ipcRenderer } = require('electron');
import { IpcRendererEvent } from 'electron'

console.log(ipcRenderer);

export type Channels = string;
console.log(ipcRenderer);
const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, args: { [key: string]: unknown }) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: { [p: string]: unknown }[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: { [p: string]: unknown }[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: { [p: string]: unknown }[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    invoke(channel: Channels, args: { [key: string]: unknown }): Promise<any> {
      return ipcRenderer.invoke(channel, args);
    }
  },
  version: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    app: () => process.env.npm_package_version
  }
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
