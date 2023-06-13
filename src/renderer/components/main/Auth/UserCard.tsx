import React from 'react';
import styles from './css/AuthModuleStyle.module.css';
import MinecraftSkin from '../../public/MinecraftSkin';
import { ComponentsPublic } from '../../ComponentsPublic';
import Button, { ButtonType } from '../../public/Input/Button';
import Icon from '../../public/Icons/Icon';
import logoutIcon from '../../../../assets/graphics/icons/leave.svg';
import { toast } from 'react-toastify';
import { AuthProviderType, FakeMinecraftAccount, MinecraftAccount } from '../../../../internal/public/AuthPublic';

import msIcon from '../../../../assets/graphics/icons/microsoft.svg';
import unknownIcon from '../../../../assets/graphics/icons/close.svg';
import unknownPlayerIcon from '../../../../assets/graphics/images/steve.png';

export interface UserAction {
  accountIndex: number;
  reloadFunc: () => void;
  action: {
    logOut: boolean;
    select: boolean;
  };
}

export interface UserCardProps extends ComponentsPublic {
  user: MinecraftAccount | undefined;
  action?: UserAction;
  displayAuthMethode?: boolean;
}

export default class UserCard extends React.Component<UserCardProps, {}> {
  constructor(props: UserCardProps) {
    super(props);
  }

  render() {
    const user: MinecraftAccount | FakeMinecraftAccount = !(this.props.user === undefined) ? this.props.user : {
      profile: { id: 'not_logged_account', name: 'User' },
      true: false,
      authType: AuthProviderType.Unknown
    };
    if (user.profile == undefined)
      throw new Error('[UserCardComponent]: Passed user don\'t has an MCProfile !');
    return (
      <div
        className={[styles.UserCard, this.props.className].join(' ')}
        style={this.props.style}
        onClick={() => {
          this.props.action?.action.select ? this.selectAccount() : null;
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
            {this.props.action?.action.logOut && (
              <Button
                action={(e) => {
                  this.logoutIcon();
                  e.stopPropagation();
                }}
                content={<Icon icon={logoutIcon} />}
                type={ButtonType.Square}
                className={styles.logOutButton}
              />
            )}
          </div>
        )}
      </div>
    );

  }

  private getIconFromAuth(authType: AuthProviderType) {
    switch (authType) {
      case AuthProviderType.Microsoft:
        return msIcon;
      case AuthProviderType.Unknown:
        return unknownIcon;
    }
  }

  private logoutIcon() {
    if (this.props.action === undefined || !this.props.action.action.logOut)
      throw new Error('action Logout() is not permitted, or action is null');

    const id: number = this.props.action.accountIndex;
    const reloadAction = this.props.action.reloadFunc;
    console.log(`Login out: ${id}`);
    const actionRes = toast.promise(
      window.electron.ipcRenderer.invoke('Auth:LogOut', { accountIndex: id }),
      {
        pending: 'Login out...',
        success: {
          render() {
            reloadAction();
            return 'Logged out';
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
    if (this.props.action === undefined || !this.props.action.action.select)
      throw new Error(
        'action SelectAccount() is not permitted, or action is null'
      );
    const id: number = this.props.action.accountIndex;
    console.log(`Selecting: ${id}`);
    window.electron.ipcRenderer.sendMessage('Auth:SelectAccount', {
      index: id
    });
    this.props.action.reloadFunc();
  }
}
