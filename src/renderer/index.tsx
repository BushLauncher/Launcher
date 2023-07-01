import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';
import MainMenuBar from './components/main/MainMenu';
import { getCurrentTheme } from '../public/ThemeManager';
import themeStyle from './theme.module.css';
import Loader from './components/public/Loader';
import { Theme } from '../public/ThemePublic';
import { ConfigProvider, theme } from 'antd';
import { ElectronHandler, versionHandler } from '../main/preload';

const container = document.getElementById('root')!;
const root = createRoot(container);

const globalState: { isOnline: boolean, theme: Promise<Theme> } = {
  isOnline: navigator.onLine, theme: getCurrentTheme()
};
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    version: typeof versionHandler
  }
}
export const globalStateContext = React.createContext(globalState);
root.render(<ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
  <globalStateContext.Provider value={globalState}>
    <Loader content={() => new Promise((resolve, reject) => {
      globalState.theme.then((theme: Theme) => {
        console.log(theme);
        resolve(<div id={'Theme-container'} className={themeStyle['Theme-' + theme]}>
          <MainMenuBar />
          <App />

        </div>);
      });

    })} className={'Theme-container'} style={undefined} />
  </globalStateContext.Provider>
</ConfigProvider>);

// calling IPC exposed from preload script
/*window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log("response: " + arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);*/
