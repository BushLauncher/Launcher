import styles from '../css/publicStyle.module.css'
import JavaIcon from '../../../../assets/graphics/images/minecraft_java_logo.svg'

export default function GameIcon({ type, customStyle }) {
  if (type !== 'vanilla') {
  }
  const getIcon = () => {
    switch (type) {
      case 'vanilla':
        return JavaIcon
      default:
        console.warn("'type' of GameIcon is not valid !")
    }
  }
  return (
    <img
      style={customStyle}
      src={getIcon()}
      alt={'Minecraft' + type + 'icon'}
      className={styles.GameIcon}
    />
  )
}
