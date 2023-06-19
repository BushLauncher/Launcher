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
import { knownAuthError } from '../../../../internal/public/AuthPublic';
import LoginPanel from './LoginPanel';
import { globalStateContext } from '../../../index';

export async function getLogin({ closable }) {
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
              if (err in knownAuthError) {
                switch (err) {
                  case knownAuthError.ClosedByUser: {
                    console.log('Login Panel closed by user');
                    root.unmount();
                    break;
                  }
                }
              } else console.warn(err);
            }
          }} />
      </>
    );
    document.querySelector('#Theme-container').appendChild(container);
  });
}

export function addAccount(account) {
  return new Promise((resolve, reject) => {
    window.electron.ipcRenderer
      .invoke('Auth:Add', { user: account })
      .then(() => resolve())
      .catch(() => {
        console.log('Error occurred');
        reject();
      });
  });
}


async function checkUserLogged(reload) {
  const isAccount = (await window.electron.ipcRenderer.invoke('Auth:getSelectedAccount', {})) !== undefined;
  if (!isAccount) {
    const notification = toast.info('Hi, please log-in an Minecraft account', {
      autoClose: false,
      hideProgressBar: true,
      closeButton: false
    });
    await addAccount(await getLogin({ closable: false }));
    toast.dismiss(notification);
    reload();
  }
}

export default function AuthModule() {
  const [dropdownOpened, setDropdownOpen] = useState(false);
  const { isOnline } = React.useContext(globalStateContext);
  const [checked, setChecked] = useState(false);

// noinspection JSIgnoredPromiseFromCall
  checkUserLogged(() => setChecked(true));
  const getData = async (reload) => {

    const getUserList = () => {

      return new Promise((resolve, reject) => {
        window.electron.ipcRenderer
          .invoke('Auth:getAccountList', {})
          .then((accountList) => {
            window.electron.ipcRenderer
              .invoke('Auth:getSelectedId', {})
              .then((selectedAccountId) => {
                resolve(
                  <div className={styles.UserListContainer}>
                    {accountList.map((account, index) => {
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
                        getLogin({ closable: true }).then((response) => {
                          if (!Object.values(knownAuthError).includes(response)) {
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
      });
    };
    return new Promise((resolve, reject) => {
      resolve(
        <div className={styles.loadedContent}>
          <div className={styles.selectedContent}>
            <Loader
              className={styles.selectedContent}
              content={() => {
                return new Promise((resolve, reject) =>
                  window.electron.ipcRenderer
                    .invoke('Auth:getSelectedAccount')
                    .then((user) =>
                      resolve(<UserCard className={styles.user} user={user} displayAction={false} />)
                    )
                    .catch((err) => console.error(err))
                );
              }}
            />
            <Button
              className={styles.button}
              content={<Icon icon={arrowIcon} />}
              type={ButtonType.Square}
              action={() => setDropdownOpen(!dropdownOpened)}
            />
          </div>
          <div
            className={[
              styles.dropdown,
              !dropdownOpened ? styles.closed : null
            ].join(' ')}
          >
            <Loader content={getUserList} />
          </div>
        </div>
      );
    });
  };
  return (
    <div className={styles.AuthModule}>
      <Loader content={getData} className={styles.loadedContent} />
    </div>
  );
}
