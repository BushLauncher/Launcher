import styles from '../../../css/AuthProviderCardStyle.module.css';
import Icon from '../../public/Icons/Icon';

import loadingIcon from '../../../../assets/graphics/icons/loading.svg';
import successIcon from '../../../../assets/graphics/icons/done.svg';
import errorIcon from '../../../../assets/graphics/icons/close.svg';

import msIcon from '../../../../assets/graphics/icons/microsoft.svg';
import { useState } from 'react';
import Button, { ButtonType } from '../../public/Input/Button';
import { Account, AuthProvider } from '../../../../types/AuthPublic';
import { toast } from 'react-toastify';
import { AuthError, GenericError, isError, KnownAuthErrorType } from '../../../../types/Errors';
import { DefaultProps } from '../../../../types/DefaultProps';

enum State {
  Normal,
  Pending,
  Success,
  Error,
}


interface ProviderDataPattern {
  icon: string,
  label: string,
  className: string
}

const ProviderData: { [key in AuthProvider]: ProviderDataPattern } = {
  [AuthProvider.Microsoft]: {
    icon: msIcon,
    label: 'Microsoft',
    className: styles.Microsoft
  }
};

interface AuthProviderCardProps extends DefaultProps {
  resolve: (account: Account) => void;
  reject: (code: GenericError) => void;
  type: AuthProvider;
}

function AuthProviderCard(props: AuthProviderCardProps): JSX.Element {
  const [state, setState] = useState(State.Normal);

  function getStateIcon() {
    switch (state) {
      case State.Normal:
        return undefined;
      case State.Pending:
        return loadingIcon;
      case State.Success:
        return successIcon;
      case State.Error:
        return errorIcon;
    }
  }

  async function LogIn(provider: AuthProvider) {
    setState(State.Pending);
    let response: Account<any> | AuthError = await window.electron.ipcRenderer.invoke('Auth:Login', { type: provider });
    if (isError(response)) {
      //error
      const error = response as AuthError;
      //Avoid error on popup close
      if(error === KnownAuthErrorType.ClosedByUser) {
        setState(State.Normal);
        return
      }
      setState(State.Error);
      setTimeout(() => setState(State.Normal), 5000);
      console.error('Cannot login: ', error);
      if (typeof error === 'string') {
        toast.error('Unexpected Error: ' + error);
      } else if ('errno' in error) {
        toast.error('Unexpected Error: ' + error.errno);
      } else if (Object.keys(KnownAuthErrorType).includes(error)) {
        //format response
        if (error == KnownAuthErrorType.UserDontHasGame) {
          toast.error('The logged Account don\'t has Minecraft Game !');
        } else if (response !== KnownAuthErrorType.ClosedByUser) props.reject(error);
      }
    } else {
      //no error
      setState(State.Success);
      setTimeout(() => props.resolve(response as Account), 1000);
    }

  };
  const data: ProviderDataPattern = ProviderData[props.type];

  return (
    <Button
      className={[styles.AuthProviderCard, data.className, props.className].join(' ')} style={props.style}
      action={() => LogIn(props.type)}
      content={
        <div className={styles.content}>
          <Icon icon={data.icon} className={styles.icon} />
          <p className={styles.label}>{data.label}</p>
          <Icon icon={getStateIcon()} className={styles.stateIcon} />
        </div>
      }
      type={ButtonType.StyleLess}
    />
  );
}

export default AuthProviderCard;
