import defaultStyle from './css/DefaultSettingsView.module.css';
import styles from './css/AboutSettingViewStyle.module.css';
import { PublicViewAdditionalProps, ViewProps } from '../../public/View';


export default function AboutView(props?: PublicViewAdditionalProps): ViewProps {
  return Object.assign( {
    content: (<div className={defaultStyle.view}>
      <div className={styles.content}>
        <h1>BushLauncher</h1>
        <div>
          <p>by <a href={'https://github.com/gagafeee'} target={'_blank'}>@Gagafeee</a></p>
        </div>
        <div>
          <p>Thanks to <a href='https://mc-heads.net' target={'_blank'}>MCHeads</a> for providing Minecraft avatars.
          </p>
        </div>
      </div>
    </div>)
  }, props);
}
