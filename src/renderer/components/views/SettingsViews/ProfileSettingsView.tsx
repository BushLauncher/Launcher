import styles from './css/ProfileViewStyle.module.css';
import Loader from '../../public/Loader';
import defaultStyle from './css/DefaultSettingsView.module.css';
import UserCard from '../../main/Auth/UserCard';
import { Button } from 'antd';
import { useState } from 'react';

export default function ProfileSettingsView() {
  const [isLoading, _setLoadings] = useState<boolean[]>([]);
  const setLoading = (index: number, val: boolean) => {
    _setLoadings((prevLoadings) => {
      const newLoadings = [...prevLoadings];
      newLoadings[index] = true;
      return newLoadings;
    });
  };
  return <div className={defaultStyle.View}>
    <div className={styles.ProfileList}>
      <p className={styles.title}>Profiles connectées:</p>
      <Button danger loading={isLoading[0]} onClick={
        async () => {
          setLoading(0, true);
          await window.electron.ipcRenderer.invoke('Auth:LogOutAll', {}).catch(err => console.error(err));
          window.electron.ipcRenderer.sendMessage('App:Relaunch', {});
        }
      } content={'Logout All'} type={'default'} className={styles.logoutAllButton}>
        Logout All
      </Button>
      <div className={styles.list}>
        <Loader content={(reload: () => void) => new Promise((resolve, reject) => {
          window.electron.ipcRenderer.invoke('Auth:getAccountList', {}).then(async (accountList: any[]) => {
            const selected = await window.electron.ipcRenderer.invoke('Auth:getSelectedId', {});
            resolve(
              accountList.map((account, index) => {
                const isSelected: boolean = index === selected;
                return <UserCard displayAuthMethode={true} user={account} key={index} action={{
                  accountIndex: index,
                  reloadFunc: reload,
                  action: { canLogOut: !isSelected, canSelect: !isSelected }
                }} style={{ backgroundColor: (isSelected ? 'var(--hover-background-color)' : null) }} />;
              })
            );
          });
        })} className={styles.list} style={undefined} />
      </div>
    </div>
  </div>;
}
