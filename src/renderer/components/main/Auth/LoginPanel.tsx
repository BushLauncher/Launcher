/*import Loader from '../../public/Loader';
import Button, { ButtonType } from '../../public/Input/Button';
import Icon from '../../public/Icons/Icon';
import closeIcon from '../../../../assets/graphics/icons/close.svg';
import { AuthProvider, Account } from '../../../../types/AuthPublic';
import AuthProviderCard from './AuthProviderCard';
import { toast } from 'react-toastify';
import { globalContext } from '../../../index';
import { errorCode, KnownAuthErrorType } from '../../../../types/Errors';

export interface loginInterface {
  resolve: (account: Account) => void;
  reject: (code: errorCode) => void;
}

export default function LoginPanel({ functions, props.closable }: {
  functions: loginInterface, props.closable?: boolean
}) {
  const { offlineMode } = React.useContext(globalContext);
  const close = () => {
    if (props.closable === undefined || props.closable) functions.reject(KnownAuthErrorType.ClosedByUser);
  };
  return (
    <div className={styles.LoginPanel}>
      <div className={styles.content}>
        {props.closable === undefined || props.closable &&
          <Button action={close} className={styles.closeButton}
                  content={<Icon icon={closeIcon} className={styles.closeIcon} />}
                  type={ButtonType.Square} />}
        <p className={styles.title}>{!offlineMode ? 'Login :' : 'You are offline'}</p>
        <div className={styles.authProviderList}>
          {!offlineMode ? Object.values(AuthProvider).map((name, index: number) => {
                if (name !== AuthProvider.Unknown) {
                  return (
                    <AuthProviderCard
                      type={name}
                      key={index}
                      reject={(err: errorCode) =>
                        toast.error(err.toString())
                      }
                      resolve={(account: Account) =>
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
}

*/

import styles from '../../../css/LoginPanel.module.css';
import { DefaultProps } from '../../../../types/DefaultProps';
import { ConfigProvider, Modal } from 'antd';
import { Account, AuthProvider } from '../../../../types/AuthPublic';
import AuthProviderCard from './AuthProviderCard';
import { GenericError, KnownAuthErrorType } from '../../../../types/Errors';
import { defaultTheme } from '../../../index';
import { useState } from 'react';


export interface LoginPanelProps extends DefaultProps {
  closable?: boolean;
  resolve: (response: Account | GenericError) => any;
}

/**
 * Login Panel is used to log in new account
 */
export default function LoginPanel(props: LoginPanelProps) {
  const [isOpen, setOpen] = useState(true);

  function resolve(account: Account) {
    setOpen(false);
    props.resolve(account);
  }

  function reject(errorCode: GenericError) {
    setOpen(false);
    console.error('Cannot login : ' + errorCode);
    props.resolve(errorCode);
  }

  function close() {
    if (!props.closable) throw new Error('Cannot close the panel');
    setOpen(false);
    reject(KnownAuthErrorType.ClosedByUser);
  }

  const closable = props.closable !== undefined && props.closable;
  return (
    <ConfigProvider theme={defaultTheme}>
      <Modal onCancel={close} destroyOnClose maskClosable={closable}
             footer={null} closeIcon={closable ? undefined : false}
             open={isOpen}
             title={'Connectez vous'}
      >
        <div className={styles.LoginPanel}>
          {Object.values(AuthProvider).map(provider => (
            <AuthProviderCard resolve={resolve} reject={reject} type={provider} key={provider} />
          ))}
        </div>
      </Modal>
    </ConfigProvider>
  );
}
