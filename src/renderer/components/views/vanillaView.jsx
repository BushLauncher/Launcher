import styles from './css/defaultViewStyle.module.css'

import GameIcon from '../public/Icons/GameIcon'
import background from '../../../assets/graphics/backgrounds/java.png'
import LaunchButton from '../main/LaunchButton'

export default function VanillaView() {
  //background
  //minecraft logo
  //start Button

  return (
    <div className={styles.Main}>
      <GameIcon
        type={'vanilla'}
        customStyle={{ width: '30vw', height: '30vh' }}
      />
      <LaunchButton
        versionSelector={true}
        customStyle={{
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
    </div>
  )
}
