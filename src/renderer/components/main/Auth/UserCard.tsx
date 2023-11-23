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

/*export default class UserCard extends React.Component<UserCardProps, {}> {
  constructor(props: UserCardProps) {
    if (typeof props.action === 'object') {
      if (typeof props.action.action === 'boolean') {
        const selected = props.action.action;
        props.action.action = { canSelect: selected, canLogOut: selected };
      }
    }
    super(props);
  }

  render() {
    const user: MSAccount | FakeMinecraftAccount = !(this.props.user === undefined) ? this.props.user : {
      profile: { id: 'not_logged_account', name: 'User' },
      true: false,
      authType: AuthProvider.Unknown
    };

    if (user.profile == undefined)
      throw new Error('[UserCardComponent]: Passed user don\'t has a MCProfile !');
    return (
      <div
        className={[styles.UserCard, this.props.className].join(' ')}
        //re indexed in constructor
        // @ts-ignore
        style={{ ...this.props.style, ...{ cursor: this.props.action && this.props.action.action.canSelect ? 'pointer' : undefined } }}
        onClick={() => {
          //re indexed in constructor
          // @ts-ignore
          this.props.action && this.props.action.action.canSelect ? this.selectAccount() : null;
        }}
      >
        {this.props.displayAuthMethode &&
          <Icon className={styles.authIcon} icon={this.getIconFromAuth(user.authType)
          } />}
        <div className={styles.data}>
          {user.true ? <MinecraftSkin
            userMCName={user.profile.name}
            className={styles.skin}
          /> : <Icon icon={unknownPlayerIcon} className={styles.skin} />}
          <p className={styles.userName} style={!user.true ? { color: '#777' } : undefined}>{user.profile.name}</p>
        </div>

        {this.props.action && (
          <div className={styles.ActionContainer}>

            {
              //re indexed in constructor
              // @ts-ignore
              this.props.action && this.props.action.action.canLogOut && (
                <Button
                  action={(e) => {
                    this.logoutIcon();
                    e.stopPropagation();
                  }}
                  content={<Icon icon={logoutIcon} className={styles.logOutButtonIcon} />}
                  type={ButtonType.Square}
                  className={styles.logOutButton}
                />
              )}
          </div>
        )}
      </div>
    );

  }

  private getIconFromAuth(authType: AuthProvider) {
    switch (authType) {
      case AuthProvider.Microsoft:
        return msIcon;
      case AuthProvider.Unknown:
        return unknownIcon;
    }
  }

  private logoutIcon() {
    //re indexed in constructor
    // @ts-ignore
    if (this.props.action && !this.props.action.action.canLogOut)
      throw new Error('action Logout() is not permitted, or action is null');

    // @ts-ignore
    const id: number = this.props.action.accountIndex;
    // @ts-ignore
    const reloadAction = this.props.action.reloadFunc;
    console.log(`Login out: ${id}`);
    const actionRes = toast.promise(
      window.electron.ipcRenderer.invoke('Auth:LogOut', { accountIndex: id }),
      {
        pending: 'Login out...',
        success: {
          render() {
            reloadAction();
            return 'Disconnected account';
          }
        },
        error: 'We couldn\'t log out your account'
      }
    );
    actionRes.catch((err) => {
      console.log(err);
      toast.error(err.toString());
    });
  }

  private selectAccount() {
    //re indexed in constructor
    // @ts-ignore
    if (this.props.action && !this.props.action.action.canSelect)
      throw new Error(
        'action SelectAccount() is not permitted, or action is null'
      );
    // @ts-ignore
    const id: number = this.props.action.accountIndex;
    console.log(`Selecting: ${id}`);
    window.electron.ipcRenderer.sendMessage('Auth:SelectAccount', {
      index: id
    });
    // @ts-ignore
    this.props.action.reloadFunc();
  }
}*/

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

  return (
    <div
      className={[styles.UserCard, props.className].join(' ')}
      style={{ ...props.style, ...{ cursor: canLogout ? 'pointer' : undefined } }}
      onClick={Select}
    >
      {props.displayAuthProvider && <Icon className={styles.authIcon} icon={getIconFromAuth(props.user.provider)} />}
      <div className={styles.data}>
        <MinecraftSkin userMCName={props.user.name} className={styles.skin} />
        <p className={styles.userName}>{props.user.name}</p>
      </div>

      {canLogout && (
        <div className={styles.ActionContainer}>
          <Button
            action={Logout}
            content={<Icon icon={logoutIcon} className={styles.logOutButtonIcon} />}
            type={ButtonType.Square}
            className={styles.logOutButton}
          />
        </div>
      )}
    </div>

  );
}
