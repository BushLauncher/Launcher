// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = string;

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
  },
  receive: async (channel: Channels, func: any) => {
    return ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
