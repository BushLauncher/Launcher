import styles from '../../css/publicStyle.module.css';
import icon from '../../../assets/graphics/icon.svg';
import { DefaultProps } from '../../../types/DefaultProps';

export default function MainIcon({ className, style }: DefaultProps) {
  return <div className={[styles.mainIcon, className].join(' ')}
              style={{ ...style, ...{ backgroundImage: `url(${icon})` } }}></div>;
}
