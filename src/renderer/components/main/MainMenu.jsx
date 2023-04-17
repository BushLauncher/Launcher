import MainIcon from '../public/mainIcon';
import styles from './css/mainComponentsStyle.module.css';
import DataTextComponent from '../public/DataText';
import FrameButton from './FrameButton';
import React, { useContext } from 'react';
import { globalStateContext } from '../../index';

export default function MainMenuBar() {
  const { isOnline } = React.useContext(globalStateContext);
  const launchNetworkCheck = ()=>{
    if(!isOnline) {
      setInterval(() => {
        if (navigator.onLine === true) window.location.reload();
      }, 10000);
    }
  }

  return (
    <div id="mainMenu" className={styles.mainMenuBar} role={'menu'}>
      <div className={styles.data}>
        <MainIcon
          customStyle={{
            width: '3.5vw',
            height: '100%',
            transform: 'scale(0.8)',
          }}
        />
        <div className={styles.frameData}>
          <p className={styles.title}>Bush Launcher</p>
          <p className={styles.version}>
            <DataTextComponent data="app-version" />
          </p>
          {!isOnline && <p className={styles.version}>[Offline Mode]</p>}
          {launchNetworkCheck()}

        </div>
      </div>
      <div className={styles.frameActionGroup}>
        <FrameButton
          type="minimize"
          customStyle={{ width: '100%', height: '100%' }}
        />
        <FrameButton
          type="close"
          customStyle={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
