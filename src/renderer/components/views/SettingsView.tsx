import styles from './css/defaultViewStyle.module.css';
import background from '../../../assets/graphics/backgrounds/java.png';

export default function SettingsView() {
  return(<div className={styles.Main}>
    <div
      style={{
        backgroundImage: `url(${background})`
      }}
      className={styles.BackgroundImage}
    />
  </div>);
}
