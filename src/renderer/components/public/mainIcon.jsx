import styles from './css/publicStyle.module.css'
import icon from '../../../assets/graphics/icon.svg'

export default function MainIcon({ customStyle }) {
  return <div className={styles.mainIcon} style={{ ...customStyle, ...{ backgroundImage: `url(${icon})` } }}></div>
}
