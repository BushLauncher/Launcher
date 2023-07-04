import styles from './css/defaultViewStyle.module.css';

import GameIcon from '../public/Icons/GameIcon';
import background from '../../../assets/graphics/backgrounds/java.png';
import LaunchButton from '../main/LaunchButton';


export default function VanillaView() {
  console.log("rerended Vanilla view");
  return <div className={styles.Main}>
    <GameIcon
      type={'vanilla'}
      style={{ width: '30vw', height: '30vh' }}
    />
    <LaunchButton

      versionSelector={true}
      style={{
        position: 'absolute',
        top: '35%'
      }}
    />
    <div
      style={{
        backgroundImage: `url(${background})`
      }}
      className={styles.BackgroundImage}
    />
  </div>;
}
