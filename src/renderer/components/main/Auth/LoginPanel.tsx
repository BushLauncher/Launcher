import Loader from '../../public/Loader';
import styles from './css/LoginPanel.module.css';
import Button, { ButtonType } from '../../public/Input/Button';
import Icon from '../../public/Icons/Icon';
import closeIcon from '../../../../assets/graphics/icons/close.svg';
import { AuthProviderType, errorCode, knownAuthError, MinecraftAccount } from '../../../../internal/public/AuthPublic';
import AuthProviderCard from './AuthProviderCard';
import { toast } from 'react-toastify';
import { globalStateContext } from '../../../index';
import React from 'react';

export interface loginInterface {
  resolve: (account: MinecraftAccount) => void;
  reject: (code: errorCode) => void;
}

export default function LoginPanel({ functions, closable }: {
  functions: loginInterface, closable?: boolean
}) {
  const close = () => {
    if (closable === undefined || closable) functions.reject(knownAuthError.ClosedByUser);
  };
  const { isOnline } = React.useContext(globalStateContext);
  const content = (reload: () => {}) => {
    return new Promise((resolve, reject) => {
      resolve(
        <div className={styles.LoginPanel}>
          <div className={styles.content}>
            {closable === undefined || closable &&
              <Button action={close} className={styles.closeButton}
                      content={<Icon icon={closeIcon} className={styles.closeIcon} />}
                      type={ButtonType.Square} />}
            <p className={styles.title}>
              {isOnline ? 'Login to your account:' : 'You are offline'}
            </p>
            <div className={styles.authProviderList}>
              {isOnline
                ? Object.keys(AuthProviderType).map(
                  (name: any, index: number) => {
                    const type: AuthProviderType = name;
                    return (
                      <AuthProviderCard
                        type={type}
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
                )
                : null}
            </div>
          </div>
        </div>
      );
    });
  };

  return <Loader content={content} className={undefined} style={undefined} />;
};
