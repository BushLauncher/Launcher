import defaultStyle from './css/DefaultSettingsView.module.css';
import styles from './css/AboutSettingViewStyle.module.css';


export default function AboutView() {
  return <div className={defaultStyle.view}>
      <div className={styles.content}>
        <h1>BushLauncher</h1>
        <div>
          <p>by <a href={'https://github.com/gagafeee'} target={'_blank'}>@Gagafeee</a></p>
        </div>
        <div>
          <p>Thanks to <a href='https://mc-heads.net' target={'_blank'}>MCHeads</a> for providing Minecraft avatars.</p>
          <p>Thanks to <a href='https://discordapp.com/users/947269166132514906' target={'_blank'}>@gatoux</a> for providing backgrounds.</p>
        </div>
      </div>
    </div>
}
