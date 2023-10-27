import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';
import MainMenuBar from './components/main/MainMenu';
import { getCurrentTheme } from '../global/ThemeManager';
import themeStyle from './Theme.module.css';
import Loader from './components/public/Loader';
import { Themes } from '../types/Theme';
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
export const defaultTheme = {
    algorithm: [theme.darkAlgorithm],
    'token': {
      'colorPrimaryBg': '#323232',
      'colorPrimaryBgHover': '#5a5858',
      'colorPrimaryBorder': '#414141',
      'colorPrimaryHover': '#6c43df',
      'colorSuccess': '#39c491',
      'colorError': '#de4747',
      'colorInfo': '#0396ff',
      'colorBgBase': '#0a0a0a',
      'fontSize': 17,
      'sizeStep': 4,
      'borderRadius': 10,
      'colorPrimary': '#7844e6'
    }
  }
;
root.render(
  <ConfigProvider theme={defaultTheme}>
    {/*Body is also Theme*/}
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
