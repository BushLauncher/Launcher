import styles from './css/defaultViewStyle.module.css';

import GameIcon from '../public/Icons/GameIcon';
import background from '../../../assets/graphics/backgrounds/java.png';
import LaunchButton from '../main/LaunchButton';
import { PublicViewAdditionalProps, ViewProps } from '../public/View';
import Tab from '../main/TabView/Tab';


export default function VanillaView(props?: PublicViewAdditionalProps, tab?: Tab): ViewProps {
  return Object.assign( {
    content: (<div className={styles.Main}>
      <GameIcon
        type={'vanilla'}
        style={{ width: '30vw', height: '30vh' }}
      />
      <LaunchButton
        onLoadChange={(isLoading: boolean)=> {
          props?.onLoading ? props.onLoading(isLoading) : undefined;
          if(tab) tab.setLoading(isLoading);
        }}
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
    </div>)
  }, props);
}
