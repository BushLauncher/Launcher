import React from 'react';
import styles from './css/AuthModuleStyle.module.css';
import MinecraftSkin from '../../public/MinecraftSkin';
import { Minecraft } from 'msmc';
import { ComponentsPublic } from '../../ComponentsPublic';
import Button, { ButtonType } from '../../public/Button';
import Icon from '../../public/Icons/Icon';
import logoutIcon from '../../../../assets/graphics/icons/leave.svg';
import { toast } from 'react-toastify';

export interface UserAction {
  accountIndex: number;
  reloadFunc: () => {};
  action: {
    logOut: boolean;
    select: boolean;
  };
}
export interface UserCardProps extends ComponentsPublic {
  user: Minecraft;
  action?: UserAction;
}
export default class UserCard extends React.Component<UserCardProps, {}> {
  constructor(props: UserCardProps) {
    super(props);
  }
  //PP
  //Username
  //actionButton
  //disconnect

  render() {
    if (this.props.user.profile == undefined)
      throw new Error(
        "[UserCardComponent]: Passed user don't has an MCProfile !"
      );
    return (
      <div
        className={[styles.UserCard, this.props.className].join(' ')}
        style={this.props.style}
        onClick={() => {
          this.props.action?.action.select ? this.selectAccount() : null;
        }}
      >
        <div className={styles.data}>
          <MinecraftSkin
            userMCName={this.props.user.profile.name}
            className={styles.skin}
          />
          <p className={styles.userName}>{this.props.user.profile.name}</p>
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
          },
        },
        error: "We couldn't log out your account",
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
      index: id,
    });
    this.props.action.reloadFunc();
  }
}
