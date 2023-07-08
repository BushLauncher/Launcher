import styles from './css/AuthModuleStyle.module.css';
import Button, { ButtonType } from '../../public/Input/Button';
import Icon from '../../public/Icons/Icon';
import arrowIcon from '../../../../assets/graphics/icons/arrow_down.svg';
import addIcon from '../../../../assets/graphics/icons/plus.svg';
import React, { useState } from 'react';
import Loader from '../../public/Loader';
import UserCard from './UserCard';
import { toast } from 'react-toastify';
import { createRoot } from 'react-dom/client';
import LoginPanel from './LoginPanel';
import { globalStateContext } from '../../../index';
import { KnownAuthErrorType } from '../../../../public/ErrorPublic';
import { MinecraftAccount } from '../../../../public/AuthPublic';
import { ComponentsPublic } from '../../ComponentsPublic';
import OutsideAlerter from '../../public/OutsideAlerter';


interface AuthModuleProps extends ComponentsPublic {
}
export async function getLogin({ closable }: {
  closable?: boolean
}): Promise<MinecraftAccount | KnownAuthErrorType> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    // noinspection JSCheckFunctionSignatures
    const root = createRoot(container);
    root.render(
      <>
        <LoginPanel
          closable={closable}
          functions={{
            resolve: (loggedUser) => {
              resolve(loggedUser);
              root.unmount();
            }, reject: (err) => {
              if (err in KnownAuthErrorType) {
                switch (err) {
                  case KnownAuthErrorType.ClosedByUser: {
                    console.log('Login Panel closed by user');
                    root.unmount();
                    resolve(err);
                    break;
                  }
                }
              } else console.error(err);
            }
          }} />
      </>
    );
    const themeContainer = document.querySelector('#Theme-container');
    if (themeContainer === null) throw new Error('Cannot find \'#Theme-container\'');
    themeContainer.appendChild(container);
  });
}

export function addAccount(account: MinecraftAccount) {
  return new Promise<void>((resolve, reject) => {
    window.electron.ipcRenderer.invoke('Auth:Add', { user: account })
      .then(() => resolve())
      .catch(() => {
        console.log('Error occurred');
        reject();
      });
  });
}
export default function AuthModule(props: AuthModuleProps) {
  const [dropdownOpened, setDropdown] = useState(false)



  function closeDropDown() {
    setDropdown(false)
  }

  let { isOnline } = React.useContext(globalStateContext);
  return (
    <Loader content={async (reload) => {
      return (<OutsideAlerter children={<div className={styles.loadedContent}>
        <div className={styles.selectedContent}>
          <Loader
            className={styles.selectedContent}
            content={async () => {
              const user = await window.electron.ipcRenderer.invoke('Auth:getSelectedAccount', {}).catch(console.error);
              return (<UserCard className={styles.user} user={user} action={false} />);
            }}
          />
          <Button
            className={styles.button}
            content={<Icon icon={arrowIcon} className={styles.dropdownIcon} />}
            type={ButtonType.Square}
            action={() => setDropdown(!dropdownOpened )}
          />
        </div>
        <div
          className={[styles.dropdown, !dropdownOpened ? styles.closed : null].join(' ')}>
          <Loader content={async () => new Promise((resolve) => {
            window.electron.ipcRenderer.invoke('Auth:getAccountList', {})
              .then((accountList) => {
                window.electron.ipcRenderer.invoke('Auth:getSelectedId', {})
                  .then((selectedAccountId) => {
                    resolve(
                      <div className={styles.UserListContainer}>
                        {accountList.map((account: MinecraftAccount, index: number) => {
                          return (
                            <UserCard
                              user={account}
                              key={index}
                              action={{
                                accountIndex: index,
                                reloadFunc: reload,
                                action: {
                                  canLogOut: selectedAccountId !== index,
                                  canSelect: selectedAccountId !== index
                                }
                              }}
                              className={[
                                styles.User,
                                selectedAccountId === index && styles.selected
                              ].join(' ')}
                            />
                          );
                        })}
                        {isOnline && <Button
                          className={styles.addButton}
                          action={() => {
                            getLogin({ closable: true })
                              .then((response) => {
                                //check if response is not an knownAuthError
                                if (!Object.keys(KnownAuthErrorType).includes(response.toString())) {
                                  response = response as MinecraftAccount;
                                  if (isOnline) {
                                    const operation = addAccount(response);
                                    toast.promise(operation, {
                                      pending:
                                        'Adding account ' + response.profile.name,
                                      success:
                                        'Added Account ' + response.profile.name,
                                      error: 'We could add account'
                                    });
                                    operation.then(() => {
                                      reload();
                                    });
                                    operation.catch((err) => {
                                      toast.error(err.toString());
                                    });
                                  }
                                }
                              });
                          }
                          }
                          content={<Icon icon={addIcon} className={styles.icon} />}
                          type={ButtonType.Rectangle}
                        />}
                      </div>
                    );
                  });
              });
          })} />
        </div>
      </div>} onClickOutside={closeDropDown} />);
    }} className={styles.loadedContent} />
  );

}
