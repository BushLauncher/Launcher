import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';
import MainMenuBar from './components/main/MainMenu';
import { App as AntApp, ConfigProvider } from 'antd';
import { ElectronHandler, versionHandler } from '../main/preload';
import darkDefault from '../themes/darkDefault';
import { ToastContainer } from 'react-toastify';
import { NotificationParam } from '../types/DefaultProps';

const container = document.getElementById('root')!;
const root = createRoot(container);

declare global {
  interface Window {
    electron: ElectronHandler;
    version: typeof versionHandler;
  }
}
interface globalState {
  offlineMode: boolean
}
const globalState: globalState = {
  offlineMode: !navigator.onLine
}

export const globalContext = React.createContext(globalState);


root.render(
    <globalContext.Provider value={globalState}>
      <ConfigProvider theme={darkDefault}>
        <MainMenuBar />
        <App />
        <ToastContainer
          position="bottom-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
          theme="dark"
        />
      </ConfigProvider>
    </globalContext.Provider>
);


window.electron.ipcRenderer.on('clearAll', () => {
  window.localStorage.clear();
});
