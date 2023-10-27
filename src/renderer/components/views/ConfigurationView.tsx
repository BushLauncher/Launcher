import LaunchButton from '../main/LaunchButton';
import { Configuration, getConfigurationInfos } from '../../../types/Configuration';
import styles from '../../css/defaultViewStyle.module.css';
import Background from '../public/BackgroundDecoder';
import GameImage from '../public/Icons/GameImage';

interface ConfigurationViewProps {
  configuration: Configuration;
}

export default function ConfigurationView(props: ConfigurationViewProps) {
  return (<div className={styles.Main}>
      <Background background={props.configuration.backgroundImage} className={styles.BackgroundImage} />
      <GameImage type={getConfigurationInfos(props.configuration).type} className={styles.GameIcon} />
      <LaunchButton version={props.configuration.versions} id={props.configuration.id} />
    </div>);
}
