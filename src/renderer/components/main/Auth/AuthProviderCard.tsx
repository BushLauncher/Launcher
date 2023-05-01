import styles from './css/AuthModuleStyle.module.css';
import Icon from '../../public/Icons/Icon';

import loadingIcon from '../../../../assets/graphics/icons/loading.svg';
import successIcon from '../../../../assets/graphics/icons/done.svg';
import errorIcon from '../../../../assets/graphics/icons/close.svg';

import msIcon from '../../../../assets/graphics/icons/microsoft.svg';
import { useState } from 'react';
import Button, { ButtonType } from '../../public/Button';
import { AuthProviderType, errorCode, knownAuthError } from '../../../../internal/public/AuthPublic';
import { MinecraftAccount } from '../../../../internal/AuthModule';
import { toast } from 'react-toastify';
import { DecodeIpcMain } from '../../../../internal/public/ErrorDecoder';

enum State {
  Normal,
  Pending,
  Success,
  Error,
}

const StateIcon = (state: State) => {
  switch (state) {
    case State.Normal:
      return null;
    case State.Pending:
      return loadingIcon;
    case State.Success:
      return successIcon;
    case State.Error:
      return errorIcon;
  }
};

const ProviderData: {
  [key: string]: { icon: string; label: string; className: string };
} = {
  Microsoft: {
    icon: msIcon,
    label: 'Microsoft',
    className: styles.Microsoft
  }
};

export interface authProviderCard {
  resolve: (account: MinecraftAccount) => void;
  reject: (code: errorCode) => void;
  type: AuthProviderType;
}

const AuthProviderCard: React.FC<authProviderCard> = (
  props: authProviderCard
) => {
  const [state, setState] = useState(State.Normal);
  const LogIn = (provider: AuthProviderType) => {
    setState(State.Pending);
    window.electron.ipcRenderer
      .invoke('Auth:Login', { type: provider })
      .then((loggedAccount: MinecraftAccount) => {
        console.log(loggedAccount);
        setState(State.Success);
        setTimeout(() => props.resolve(loggedAccount), 1000);
      })
      .catch((err: any | knownAuthError) => {
        const decodedError: knownAuthError | string = DecodeIpcMain(err.toString());
        setState(State.Error);
        setTimeout(() => setState(State.Normal), 5000);
        if (decodedError in knownAuthError) {
          if (decodedError == knownAuthError.UserDontHasGame) toast.error('The Account don\'t has Minecraft Game !');
        } else props.reject(err);
      });
  };
  const data = ProviderData[props.type];
  return (
    <Button
      className={[styles.AuthProviderCard, data.className].join(' ')}
      action={() => LogIn(props.type)}
      content={
        <div className={styles.content}>
          <Icon icon={data.icon} className={styles.icon} />
          <p className={styles.label}>{data.label}</p>
          <Icon icon={StateIcon(state)} className={styles.stateIcon} />
        </div>
      }
      type={ButtonType.Square}
    ></Button>
  );
};
export default AuthProviderCard;
