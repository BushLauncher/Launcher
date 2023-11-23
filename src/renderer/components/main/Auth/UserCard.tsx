import React from 'react';
import styles from '../../../css/UserCardStyle.module.css';
import MinecraftSkin from '../../public/MinecraftSkin';
import { DefaultProps } from '../../../../types/DefaultProps';
import Button, { ButtonType } from '../../public/Input/Button';
import Icon from '../../public/Icons/Icon';
import logoutIcon from '../../../../assets/graphics/icons/leave.svg';
import { Account, AuthProvider } from '../../../../types/AuthPublic';
import msIcon from '../../../../assets/graphics/icons/microsoft.svg';
import RenderConsoleManager, { ProcessType } from '../../../../global/RenderConsoleManager';

const console = new RenderConsoleManager('UserCard', ProcessType.Render);

export interface UserAction {
  onLogout?: () => any;
  onSelect?: () => any;
}

export interface UserCardProps extends DefaultProps, UserAction {
  user: Account;
  displayAuthProvider?: boolean;
}

function getIconFromAuth(authType: AuthProvider) {
  switch (authType) {
    case AuthProvider.Microsoft:
      return msIcon;
  }
}

export default function UserCard(props: UserCardProps) {
  //compile user actions
  const canLogout = typeof props.onLogout !== 'undefined';

  function Logout(e: React.MouseEvent) {
    if (props.onLogout !== undefined) {
      console.log('Requesting logout account ' + props.user.name);
      props.onLogout();
      e.stopPropagation();
    }
  }

  function Select(e: React.MouseEvent) {
    if (props.onSelect !== undefined) {
      console.log('Requesting selection of account ' + props.user.name);
      props.onSelect();
      e.stopPropagation();
    }
  }

  return (<div
      className={[styles.UserCard, props.className].join(' ')}
      style={{ ...props.style, ...{ cursor: canLogout ? 'pointer' : undefined } }}
      onClick={Select}
    >
      {props.displayAuthProvider && <Icon className={styles.authIcon} icon={getIconFromAuth(props.user.provider)} />}
      <div className={styles.data}>
        <MinecraftSkin userMCName={props.user.name} className={styles.skin} />
        <p className={styles.userName}>{props.user.name}</p>
      </div>

      {canLogout && (<div className={styles.ActionContainer}>
          <Button
            action={Logout}
            content={<Icon icon={logoutIcon} className={styles.logOutButtonIcon} />}
            type={ButtonType.Square}
            className={styles.logOutButton}
          />
        </div>)}
    </div>

  );
}
