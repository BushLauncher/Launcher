import styles from '../../../css/AuthModuleStyle.module.css';
import Icon from '../../public/Icons/Icon';

import loadingIcon from '../../../../assets/graphics/icons/loading.svg';
import successIcon from '../../../../assets/graphics/icons/done.svg';
import errorIcon from '../../../../assets/graphics/icons/close.svg';

import msIcon from '../../../../assets/graphics/icons/microsoft.svg';
import { useState } from 'react';
import Button, { ButtonType } from '../../public/Input/Button';
import { Account, AuthProvider, MSAccount } from '../../../../types/AuthPublic';
import { toast } from 'react-toastify';
import { errorCode, isError, KnownAuthErrorType } from '../../../../types/Errors';
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
  reject: (code: errorCode) => void;
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

  const LogIn = async (provider: AuthProvider) => {
    setState(State.Pending);
    let response: Account | KnownAuthErrorType | string = await window.electron.ipcRenderer.invoke('Auth:Login', { type: provider });
    if (isError(response)) {
      //error
      response = response as KnownAuthErrorType | string;
      setState(State.Error);
      setTimeout(() => setState(State.Normal), 5000);
      if (Object.keys(KnownAuthErrorType).includes(response)) {
        //format response
        response = response as KnownAuthErrorType;
        if (response == KnownAuthErrorType.UserDontHasGame) toast.error('The logged Account don\'t has Minecraft Game !');
        else if (response !== KnownAuthErrorType.ClosedByUser) props.reject(response);
      } else {
        response = response as string;
        toast.error('Unexpected Error: ' + response);
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
