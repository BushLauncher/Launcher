import defaultStyle from './css/DefaultSettingsView.module.css';
import styles from './css/AboutSettingViewStyle.module.css';

export default function AboutView() {
  return <div className={defaultStyle.view}>
    <div className={styles.content}>
      <p>BushLauncher</p>
      <p>by <a href={'https://github.com/gagafeee'} target={'_blank'}>@Gagafeee</a></p>
      <p>Thanks to <a href='https://mc-heads.net'>MCHeads</a> for providing Minecraft avatars.
      </p>
    </div>
  </div>;
}

//TODO: rework this page
