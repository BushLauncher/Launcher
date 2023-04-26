import Loader from '../../public/Loader';
import styles from './css/LoginPanel.module.css';
import Button, { ButtonType } from '../../public/Button';
import Icon from '../../public/Icons/Icon';
import closeIcon from '../../../../assets/graphics/icons/close.svg';
import {
  AuthProviderType,
  errorCode,
  knownError,
} from '../../../../internal/public/AuthPublic';
import AuthProviderCard from './AuthProviderCard';
import { toast } from 'react-toastify';
import { MinecraftAccount } from '../../../../internal/AuthModule';

export interface loginInterface {
  resolve: (account: MinecraftAccount) => void;
  reject: (code: errorCode) => void;
}

const LoginPanel: React.FC<loginInterface> = (functions: loginInterface) => {
  const close = () => {
    functions.reject(knownError.ClosedByUser);
  };

  const content = (reload: () => {}) => {
    return new Promise((resolve, reject) => {
      resolve(
        <div className={styles.LoginPanel}>
          <div className={styles.content}>
            <Button
              action={close}
              className={styles.closeButton}
              content={<Icon icon={closeIcon} className={styles.closeIcon} />}
              type={ButtonType.Square}
            />
            <p className={styles.title}>{'Login to your account:'}</p>
            <div className={styles.authProviderList}>
              {Object.keys(AuthProviderType)
                .map((name: any, index: number) => {
                  const type: AuthProviderType = name;
                  return (
                    <AuthProviderCard
                      type={type}
                      key={index}
                      reject={(err: errorCode) => toast.error(err.toString())}
                      resolve={(account: MinecraftAccount) =>
                        functions.resolve(account)
                      }
                    />
                  );
                })}
            </div>
          </div>
        </div>
      );
    });
  };

  return <Loader content={content} className={undefined} style={undefined} />;
};
export default LoginPanel;
