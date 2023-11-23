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
  return (<ConfigProvider theme={defaultTheme}>
      <Modal onCancel={close} destroyOnClose maskClosable={closable}
             footer={null} closeIcon={closable ? undefined : false}
             open={isOpen}
             title={'Connectez vous'}
      >
        <div className={styles.LoginPanel}>
          {Object.values(AuthProvider).map(provider => (
            <AuthProviderCard resolve={resolve} reject={reject} type={provider} key={provider} />))}
        </div>
      </Modal>
    </ConfigProvider>);
}
