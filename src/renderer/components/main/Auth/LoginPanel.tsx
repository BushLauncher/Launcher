import Loader from '../../public/Loader';
import styles from '../../../css/LoginPanel.module.css';
import Button, { ButtonType } from '../../public/Input/Button';
import Icon from '../../public/Icons/Icon';
import closeIcon from '../../../../assets/graphics/icons/close.svg';
import { AuthProviderType, MinecraftAccount } from '../../../../types/AuthPublic';
import AuthProviderCard from './AuthProviderCard';
import { toast } from 'react-toastify';
import { globalContext } from '../../../index';
import React from 'react';
import { errorCode, KnownAuthErrorType } from '../../../../types/Errors';

export interface loginInterface {
  resolve: (account: MinecraftAccount) => void;
  reject: (code: errorCode) => void;
}

export default function LoginPanel({ functions, closable }: {
  functions: loginInterface, closable?: boolean
}) {
  const { isOnline } = React.useContext(globalContext);
  const close = () => {
    if (closable === undefined || closable) functions.reject(KnownAuthErrorType.ClosedByUser);
  };
  const content = async () => {
    return (
      <div className={styles.LoginPanel}>
        <div className={styles.content}>
          {closable === undefined || closable &&
            <Button action={close} className={styles.closeButton}
                    content={<Icon icon={closeIcon} className={styles.closeIcon} />}
                    type={ButtonType.Square} />}
          <p className={styles.title}>{isOnline ? 'Login :' : 'You are offline'}</p>
          <div className={styles.authProviderList}>
            {isOnline ? Object.values(AuthProviderType).map((name, index: number) => {
                  if (name !== AuthProviderType.Unknown) {
                    return (
                      <AuthProviderCard
                        type={name}
                        key={index}
                        reject={(err: errorCode) =>
                          toast.error(err.toString())
                        }
                        resolve={(account: MinecraftAccount) =>
                          functions.resolve(account)
                        }
                      />
                    );
                  }
                }
              )
              : undefined}
          </div>
        </div>
      </div>
    );

  };

  return <Loader content={content} />;
};
