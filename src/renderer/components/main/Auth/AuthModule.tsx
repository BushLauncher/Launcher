import styles from '../../../css/AuthModuleStyle.module.css';
import { DefaultProps } from '../../../../types/DefaultProps';
import AuthManager from './AuthManager';
import UserCard from './UserCard';
import Loader, { LoaderRefType } from '../../public/Loader';
import { Button, RefSelectProps, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import Icon from '../../public/Icons/Icon';
import addIcon from '../../../../assets/graphics/icons/plus.svg';
import { AuthError, KnownAuthErrorType } from '../../../../types/Errors';
import { toast } from 'react-toastify';

export interface AuthModuleProps extends DefaultProps {
  authManager: AuthManager;
}

type SelectItem = { label: React.ReactElement, value: string }


export default function AuthModule(props: AuthModuleProps) {
  const [isLoading, setLoading] = useState(false);
  const loader = useRef<LoaderRefType>(null);
  const select = useRef<RefSelectProps>(null)
  const refresh = async () => {
    await props.authManager.refreshData();
    loader.current?.refresh();
    setLoading(false);
  };
  useEffect(() => {
    // Register refresh event from backend
    window.electron.ipcRenderer.on('Auth:RefreshEvent', refresh);

    return () => {
      window.electron.ipcRenderer.removeListener('Auth:RefreshEvent', refresh);
    };
  }, []);

  return (
    <div className={[styles.AuthModule, props.className].join(' ')} style={props.style}>
      <Loader ref={loader}>
        {(refresh) => new Promise(async (resolve, reject) => {
          ////
          //get datas
          const accountList = await props.authManager.getAccountList();
          const currentAccount = await props.authManager.getSelectedAccount();
          //Check data validity
          if (currentAccount !== null) {
            //Construct Dropdown
            //Build dropdown
            const dropdownItems: SelectItem[] = accountList.map((account): SelectItem => {
              //create item
              const isSelected = account.name === currentAccount.name;
              return {
                value: account.name,
                label: (
                  <UserCard user={account} key={account.name} displayAuthProvider
                            onLogout={!isSelected ? () => props.authManager.requestLogout(account) : undefined}
                            className={isSelected ? styles.SelectedUser : styles.User} />
                )
              };
            });
            //construct onClick function (select the account)
            const onClick = (val: string) => {
              setLoading(true);
              console.log(`Request select ${val}`);
              props.authManager.findIndex(val)
                .then(async index => await window.electron.ipcRenderer.invoke('Auth:SelectAccount', { index: index }));
            };
            //construct add function
            const add = () => {
              select.current?.blur();
              setLoading(true);
              props.authManager.LoginNew([{ closable: true }])
                .then(account => {
                  toast.success('Added account ' + account.name);
                  setLoading(false);
                })
                .catch((error: AuthError) => {
                  if (error === KnownAuthErrorType.ClosedByUser) console.log('Popup closed by user');
                  else if (error === KnownAuthErrorType.UserAlreadyRegistered) {
                    toast.warn('This account already exist');
                  } else {
                    toast.error('Cannot add new account: ' + error);
                    console.error('Couldn\'t add new Account: ', error);
                  }
                  setLoading(false);
                });
            };
            //
            resolve(
              <Select ref={select} onChange={onClick} loading={isLoading} options={dropdownItems} bordered={false} popupMatchSelectWidth={false}
                      value={currentAccount.name} popupClassName={styles.Dropdown} listHeight={165} className={styles.AuthModule}
                      dropdownRender={(dropdown) => (
                        <>
                          {dropdown}
                          <Button onClick={add} className={styles.AddButton}>
                            <Icon icon={addIcon} className={styles.icon} />
                          </Button>
                        </>
                      )}
              />
            );
          } else {
            console.warn('Rendering null selected account');
            resolve(<div className={styles.AuthModule}></div>);
          }
        })}
      </Loader>
    </div>
  );
}
