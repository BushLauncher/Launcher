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
//ProviderData shouldn't implement AuthProviderType.unknown
// @ts-ignore
const ProviderData: {
  [key in AuthProviderType]: { icon: string; label: string; className: string };
} = {
  [AuthProviderType.Microsoft]: {
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

function AuthProviderCard(props: authProviderCard): JSX.Element {
  const [state, setState] = useState(State.Normal);
  if (props.type === AuthProviderType.Unknown) return <div></div>;
  const LogIn = (provider: AuthProviderType) => {
    setState(State.Pending);
    window.electron.ipcRenderer
      .invoke('Auth:Login', { type: provider })
      .then((response: MinecraftAccount | string) => {
        if (Object.values(KnownAuthErrorType).includes(response as unknown as KnownAuthErrorType)) {
          //error
          setState(State.Error);
          setTimeout(() => setState(State.Normal), 5000);
          if (!Object.values(KnownAuthErrorType).includes(response as unknown as KnownAuthErrorType)) {
            toast.error('Unexpected Error: ' + response);
          } else {
            //format response
            response = KnownAuthErrorType[response as unknown as KnownAuthErrorType];

            if (response == KnownAuthErrorType.UserDontHasGame) toast.error('The Account don\'t has Minecraft Game !');
            if (response !== KnownAuthErrorType.ClosedByUser) props.reject(response);
          }
        } else {
          //no error
          setState(State.Success);

          //at this point response shouldn't be a string
          if (typeof response === 'string') throw new Error('response souldn\'t be a string: (' + response + ')');
          setTimeout(() => props.resolve(response as MinecraftAccount), 1000);
        }
      })
      .catch((err: any | KnownAuthErrorType) => {
        //cannot be rejected because reject is resolved to get the error
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
      type={ButtonType.StyleLess}
    ></Button>
  );
};
export default AuthProviderCard;
