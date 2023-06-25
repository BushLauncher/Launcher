import { Callback, CallbackType } from '../../../public/GameDataPublic';
import styles from './css/publicStyle.module.css';
import Icon from './Icons/Icon';
import arrowIcon from '../../../assets/graphics/icons/caret-left.svg';
import Button, { ButtonType } from './Input/Button';
import { useState } from 'react';


export default function CallbackMessage({ callback }: { callback: Callback }) {
  const [extended, setExtended] = useState(false);
  if (callback.type === CallbackType.Error) {
    if (typeof callback.return !== 'string') {
      return (
        <div className={styles.CallbackMessage}>
          <p className={styles.message}>{callback.return.message}</p>
          <p className={styles.description}>{callback.return.desc}</p>
          {callback.return.resolution &&
            <Button action={() => setExtended(!extended)}
                    content={<Icon icon={arrowIcon} style={{
                      transform: `rotate(${extended ? -90 : 0}deg)`,
                      width: '100%',
                      height: '100%'
                    }} />}
                    type={ButtonType.StyleLess}
                    className={styles.arrow} />}
          {extended && callback.return.resolution &&
            <p className={styles.resolutions}>{callback.return.resolution}</p>}
        </div>
      );
    } else {
      return (
        <div>
          <p>{callback.return}</p>
        </div>
      );
    }
  } else {
    return (
      <div>
        <p>{callback.return}</p>
      </div>
    );
  }
}
