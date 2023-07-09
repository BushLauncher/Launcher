import styles from './css/AuthModuleStyle.module.css';
import Icon from '../../public/Icons/Icon';

import loadingIcon from '../../../../assets/graphics/icons/loading.svg';
import successIcon from '../../../../assets/graphics/icons/done.svg';
import errorIcon from '../../../../assets/graphics/icons/close.svg';

import msIcon from '../../../../assets/graphics/icons/microsoft.svg';
import { useState } from 'react';
import Button, { ButtonType } from '../../public/Input/Button';
import { AuthProviderType, MinecraftAccount } from '../../../../public/AuthPublic';
import { toast } from 'react-toastify';
import { errorCode, KnownAuthErrorType } from '../../../../public/ErrorPublic';

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

//ProviderData shouldn't implement AuthProviderType.unknown
// @ts-ignore
const ProviderData: { [key in AuthProviderType]: ProviderDataPattern } = {
  [AuthProviderType.Microsoft]: {
    icon: msIcon,
    label: 'Microsoft',
    className: styles.Microsoft
  }
};

interface authProviderCard {
  resolve: (account: MinecraftAccount) => void;
  reject: (code: errorCode) => void;
  type: AuthProviderType;
}

function AuthProviderCard(props: authProviderCard): JSX.Element {
  const [state, setState] = useState(State.Normal);
  if (props.type === AuthProviderType.Unknown) throw new Error('Cannot create Auth provider Card from Unknown AuthProviderType');

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

  const LogIn = async (provider: AuthProviderType) => {
    setState(State.Pending);
    let response: MinecraftAccount | KnownAuthErrorType | string = await window.electron.ipcRenderer.invoke('Auth:Login', { type: provider });
    if (Object.keys(KnownAuthErrorType).includes(response.toString()) || typeof response === 'string') {
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
      setTimeout(() => props.resolve(response as MinecraftAccount), 1000);
    }

  };
  const data: ProviderDataPattern = ProviderData[props.type];

  return (
    <Button
      className={[styles.AuthProviderCard, data.className].join(' ')}
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
