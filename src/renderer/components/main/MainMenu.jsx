import MainIcon from '../public/MainIcon';
import styles from './css/mainComponentsStyle.module.css';
import DataTextComponent from '../public/DataText';
import FrameButton from './FrameButton';
import React from 'react';
import { globalStateContext } from '../../index';
import { toast } from 'react-toastify';

export default function MainMenuBar() {
  const { isOnline } = React.useContext(globalStateContext);
  let ConnexionToast = React.useRef(null);
  const launchNetworkCheck = () => {
    const getNetworkState = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!isOnline) {
            if (navigator.onLine) {
              resolve();
            }
          } else {
            if (!navigator.onLine) {
              reject();
            }
          }
        }, 20000);
      });
    };
    const updateNetworkState = () => {
      if (navigator.onLine !== isOnline) {
        //if the current state != global state
        ConnexionToast = toast.promise(
          getNetworkState,
          {
            pending: `Connecting to the internet... [currently: ${navigator.onLine}, context: ${isOnline}]`,
            success: {
              render() {
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
                return 'Connected !';
              }
            },
            error: {
              render() {
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
                return 'We lost connexion !';
              }
            }
          },
          {
            toastId: 'networkConnexion',
            autoClose: 20000,
            hideProgressBar: true
          }
        );
      } else {
        if(toast.isActive(ConnexionToast)){
          ConnexionToast.close()
        }
      }
    };
    updateNetworkState();
    setInterval(updateNetworkState, 10000);
  };

  return (
    <div id='mainMenu' className={styles.mainMenuBar} role={'menu'}>
      <div className={styles.data}>
        <MainIcon
          customStyle={{
            width: '3.5vw',
            height: '100%',
            transform: 'scale(0.8)'
          }}
        />
        <div className={styles.frameData}>
          <p className={styles.title}>Bush Launcher</p>
          <p className={styles.version}>
            <DataTextComponent data='app-version' />
          </p>
          {!isOnline && <p className={styles.version}>[Offline Mode]</p>}
          {launchNetworkCheck()}
        </div>
      </div>
      <div className={styles.frameActionGroup}>
        <FrameButton
          type='minimize'
          customStyle={{ width: '100%', height: '100%' }}
        />
        <FrameButton
          type='close'
          customStyle={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
