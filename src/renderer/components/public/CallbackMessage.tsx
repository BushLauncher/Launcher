import { Callback, CallbackType, ExitedReason } from '../../../public/GameDataPublic';
import styles from './css/publicStyle.module.css';
import Icon from './Icons/Icon';
import arrowIcon from '../../../assets/graphics/icons/caret-left.svg';
import Button, { ButtonType } from './Input/Button';
import { useState } from 'react';
import { knowErrorFormat } from '../../../public/ErrorPublic';

export default function CallbackMessage({ callback }: { callback: Callback }) {
  const [extended, setExtended] = useState(false);
  console.error(callback);
  if (callback.type === CallbackType.Exited) {
    callback.return = callback.return as { reason: ExitedReason, display?: string | knowErrorFormat };
    switch (callback.return.reason) {
      case ExitedReason.Error: {
        if (typeof callback.return === 'string')
          return (
            <div>
              <p>{callback.return}</p>
            </div>
          );
        else {
          callback.return = callback.return as knowErrorFormat;
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
        }
      }
      case ExitedReason.Canceled:
        return (<div>
          <p>{'Launch cancelled: ' + callback.return.display}</p>
        </div>);
      default:
        return (<div>
          <p>{callback.return}</p>
        </div>);
    }
  } else if (callback.type === CallbackType.Error){
    console.log(callback.return.display || callback.return);
    return <div>{callback.return.display || callback.return}</div>
  } else{
    console.warn('Cannot display CallbackMessage from type ' + callback.type + ' (not implemented)\n', callback);
    return (<div>{callback.return}</div>);
  }

}
