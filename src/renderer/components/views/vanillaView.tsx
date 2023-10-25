import styles from './css/defaultViewStyle.module.css';

import GameIcon from '../public/Icons/GameIcon';
import background from '../../../assets/graphics/backgrounds/java.png';
import LaunchButton from '../main/LaunchButton';
import { GameVersion } from '../../../public/GameDataPublic';


export default function VanillaView({key, versions}:{key: string, versions: GameVersion[] | GameVersion}) {
  console.log(versions);
  return (<div className={styles.Main} style={{
    backgroundImage: `url(${background})`
  }}>
    <GameIcon
      type={'vanilla'}
      style={{ width: '30vw', marginTop: "16vh" }}
    />
    <LaunchButton
      id={key}
      version={versions}
      style={{
        position: 'absolute',
        top: '35%',
        boxSizing: "content-box"
      }}
    />
  </div>);
}
