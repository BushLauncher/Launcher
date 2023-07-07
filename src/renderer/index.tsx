import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';
import MainMenuBar from './components/main/MainMenu';
import { getCurrentTheme } from '../public/ThemeManager';
import themeStyle from './theme.module.css';
import Loader from './components/public/Loader';
import { Themes } from '../public/ThemePublic';
import { ConfigProvider, theme } from 'antd';
import { ElectronHandler, versionHandler } from '../main/preload';

const container = document.getElementById('root')!;
const root = createRoot(container);

const globalState: { isOnline: boolean, theme: Promise<Themes> } = {
  isOnline: navigator.onLine, theme: getCurrentTheme()
};
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    version: typeof versionHandler;
  }
}
export const globalStateContext = React.createContext(globalState);
const defaultTheme = {
  algorithm: [theme.darkAlgorithm],
  token: {
    colorPrimaryBg: '#1a1919',
    colorPrimaryBgHover: '#5a5858',
    colorPrimaryBorder: '#414141',
    colorPrimary: '#7844e6',
    colorPrimaryHover: '#6c43df',
    colorSuccess: '#39c491',
    colorError: '#de4747',
    colorInfo: '#0396ff',
    colorBgBase: '#0a0a0a',
    fontSize: 14,
    sizeStep: 4,
    borderRadius: 10
  }
};
root.render(
  <ConfigProvider theme={defaultTheme}>
    <globalStateContext.Provider value={globalState}>
      <Loader content={async () => {
        const theme: Themes = await globalState.theme;
        return (<div id={'Theme-container'} className={themeStyle['Theme-' + theme]}>
          <MainMenuBar />
          <App />
        </div>);
      }} />
    </globalStateContext.Provider>
  </ConfigProvider>);


window.electron.ipcRenderer.on('clearAll', () => {
  window.localStorage.clear();
});
