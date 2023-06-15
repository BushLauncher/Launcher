import styles from './css/ProfileViewStyle.module.css';
import Button, { ButtonType } from '../../public/Input/Button';
import ButtonStyle from '../../public/css/inputStyle.module.css';
import Loader from '../../public/Loader';
import defaultStyle from './css/DefaultSettingsView.module.css';
import UserCard from '../../main/Auth/UserCard';

export default function ProfileSettingsView() {
  return <div className={defaultStyle.View}>
    <div className={styles.ProfileList}>
      <p className={styles.title}>Profiles connectées:</p>
      <Button action={() => {
        window.electron.ipcRenderer.invoke('Auth:LogOutAll', {}).then(() => {
          window.location.reload();
        });
      }} content={<p>Logout All</p>} type={ButtonType.Rectangle}
              className={[ButtonStyle.danger, styles.logoutAllButton].join(' ')} />
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
