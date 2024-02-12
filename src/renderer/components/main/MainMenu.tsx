import MainIcon from '../public/MainIcon';
import styles from '../../css/mainComponentsStyle.module.css';
import DataTextComponent from '../public/DataText';
import React, { useContext } from 'react';
import { globalContext } from '../../index';
import { DefaultProps } from '../../../types/DefaultProps';

export default function MainMenuBar() {
  const {offlineMode} = useContext(globalContext);

  return (
    <div id='mainMenu' className={styles.mainMenuBar} role={'menu'}>
      <div className={styles.data}>
        <MainIcon
          style={{
            width: '3.5vw', height: '100%', transform: 'scale(0.8)'
          }}
        />
        <div className={styles.frameData}>
          <p className={styles.title}>Bush Launcher</p>
          <DataTextComponent data='app-version' className={styles.version} />
          {offlineMode && <p className={styles.version}>[Offline Mode]</p>}
        </div>
      </div>
      <div className={styles.frameActionGroup}>
        <FrameButton
          type='minimize'
          style={{ width: '100%', height: '100%' }}
        />
        <FrameButton
          type='close'
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>);
}


/*******************/
import closeIcon from '../../../assets/graphics/icons/close.svg';
import minimizeIcon from '../../../assets/graphics/icons/window-minimize.svg';
import { toast } from 'react-toastify';
interface FrameButtonProps extends DefaultProps {
  type: 'close' | 'minimize',
}

function FrameButton({ type, style, className }: FrameButtonProps) {
  function closeApp() {
    window.electron.ipcRenderer.sendMessage('App:Close', {});
  }

  function minimizeApp() {
    window.electron.ipcRenderer.sendMessage('App:Minimize', {});
  }

  function getClass() {
    switch (type) {
      case 'close':
        return closeIcon;
      case 'minimize':
        return minimizeIcon;
      default:
        console.error('\'type\' props of FrameButton is not valid !');
    }
  }

  function action(): void {
    switch (type) {
      case 'minimize':
        return minimizeApp();
      case 'close':
        return closeApp();
      default:
        throw new Error('Cannot find action for FrameButton');
    }
  }

  return (
    <div
      className={[styles.frameButton, className].join(' ')}
      datatype={type}
      onClick={action}
      style={Object.assign( { backgroundImage: `url(${getClass()})` }, style)}
    ></div>
  );
}
