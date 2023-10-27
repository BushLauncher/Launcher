import styles from '../../css/defaultViewStyle.module.css';
import LaunchButton from '../main/LaunchButton';
import { GameType, GameVersion } from '../../../types/Versions';
import GameImage from '../public/Icons/GameImage';
import Background from '../public/BackgroundDecoder';
import { ConfigurationLocalBackground } from '../../../types/Configuration';


export default function VanillaView({ key }: { key: string}) {
  return (
    <div className={styles.Main}>
      <Background background={{type: 'Local', data: ConfigurationLocalBackground.vanilla}} className={styles.BackgroundImage}/>
      <GameImage type={GameType.VANILLA} className={styles.GameIcon} />
      <LaunchButton
        id={key}
        version={[]}
        style={{
          position: 'absolute',
          top: '35%',
          boxSizing: 'content-box'
        }}
      />
    </div>
  );
}
