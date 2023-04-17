// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent, app } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    invoke(channel: Channels, args: any[]): Promise<unknown> {
      return ipcRenderer.invoke(channel, args);
    }
  },
  version: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    app: () => process.env.npm_package_version,
  },
};
/*const storage = {
  get: (arg: { key: string }) => {
    ipcRenderer.invoke('getData', arg).then((data) => {
      return data;
    });
  },
  set: (arg: { key: string; value: any }) => {
    ipcRenderer.invoke('setData', arg).then((data) => {
      return data;
    });
  },
};
*/
contextBridge.exposeInMainWorld('electron', electronHandler);
//contextBridge.exposeInMainWorld('storage', storage);

export type ElectronHandler = typeof electronHandler;
