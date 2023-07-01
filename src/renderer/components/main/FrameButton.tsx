import styles from './css/mainComponentsStyle.module.css';
import closeIcon from '../../../assets/graphics/icons/close.svg';
import minimizeIcon from '../../../assets/graphics/icons/window-minimize.svg';
import { ComponentsPublic } from '../ComponentsPublic';


interface FrameButtonProps extends ComponentsPublic {
  type: 'close' | 'minimize',
}

export default function FrameButton({ type, style, className }: FrameButtonProps) {
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

