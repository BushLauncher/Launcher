import styles from './css/publicStyle.module.css';
import icon from '../../../assets/graphics/icon.svg';
import { ComponentsPublic } from '../ComponentsPublic';

export default function MainIcon({ className, style }: ComponentsPublic) {
  return <div className={[styles.mainIcon, className].join(' ')}
              style={{ ...style, ...{ backgroundImage: `url(${icon})` } }}></div>;
}
