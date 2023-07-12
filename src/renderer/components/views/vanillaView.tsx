import styles from './css/defaultViewStyle.module.css';

import GameIcon from '../public/Icons/GameIcon';
import background from '../../../assets/graphics/backgrounds/java.png';
import LaunchButton from '../main/LaunchButton';


export default function VanillaView({key}:{key: string}) {
  return (<div className={styles.Main} style={{
    backgroundImage: `url(${background})`
  }}>
    <GameIcon
      type={'vanilla'}
      style={{ width: '30vw', marginTop: "16vh" }}
    />
    <LaunchButton
      id={key}
      versionSelector={true}
      style={{
        position: 'absolute',
        top: '35%',
        boxSizing: "content-box"
      }}
    />
  </div>);
}
