import styles from './css/mainComponentsStyle.module.css';

import closeIcon from '../../../assets/graphics/icons/close.svg';
import minimizeIcon from '../../../assets/graphics/icons/window-minimize.svg';


function closeApp() {
  window.electron.ipcRenderer.sendMessage('App:Close', []);
}

function minimizeApp() {
  window.electron.ipcRenderer.sendMessage('App:Minimize', []);
}

export default function FrameButton({ type, customStyle }) {
  const getClass = () => {
    switch (type) {
      case 'close':
        return closeIcon;
      case 'minimize':
        return minimizeIcon;
      default:
        console.error('\'type\' props of FrameButton is not valid !');
    }
  };
  return (
    <div
      className={styles.frameButton}
      datatype={type}
      onClick={type === 'minimize' ? minimizeApp : type === 'close' ? closeApp : console.error('Cannot find action for FrameButton')}
      style={Object.assign(customStyle, { backgroundImage: `url(${getClass()})` })}
    ></div>
  );
}

