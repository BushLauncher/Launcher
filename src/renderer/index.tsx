import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';
import MainMenuBar from './components/main/MainMenu';

const container = document.getElementById('root')!;
const root = createRoot(container);

const globalState = {
  isOnline: navigator.onLine,
};

export const globalStateContext = React.createContext(globalState);

root.render(
  <globalStateContext.Provider value={globalState}>
    <MainMenuBar/>
    <App />
  </globalStateContext.Provider>
);

// calling IPC exposed from preload script
/*window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log("response: " + arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);*/
