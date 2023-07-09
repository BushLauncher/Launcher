import styles from '../css/publicStyle.module.css';
import JavaIcon from '../../../../assets/graphics/images/minecraft_java_logo.png';
import { ComponentsPublic } from '../../ComponentsPublic';

interface GameIconProps extends ComponentsPublic {
  type: 'vanilla';
}

export default function GameIcon({ type, style, className }: GameIconProps) {
  const getIcon = () => {
    switch (type) {
      case 'vanilla':
        return JavaIcon;
      default:
        console.warn('\'type\' of GameIcon is not valid !');
    }
  };
  return (
    <img
      style={style}
      src={getIcon()}
      alt={'Minecraft' + type + 'icon'}
      className={[styles.GameIcon, className].join(' ')}
    />
  );
}
