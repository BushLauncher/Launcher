import TabView, { TabParams } from './components/main/TabView/TabView';
import './defaultStyle.css';
import grassBlockImg from '../assets/graphics/images/grass_block.png';
import settingIcon from '../assets/graphics/icons/settings.svg';
import VanillaView from './components/views/vanillaView';
import Loader from './components/public/Loader';
import { toast, ToastContainer } from 'react-toastify';
import SettingsView from './components/views/SettingsView';
import AuthModule, { addAccount, getLogin } from './components/main/Auth/AuthModule';
import AuthModuleStyle from './components/main/Auth/css/AuthModuleStyle.module.css';
import { KnownAuthErrorType } from '../public/ErrorPublic';
import React from 'react';
import { globalStateContext } from './index';
import { MinecraftAccount } from '../public/AuthPublic';

const prefix = '[App]: ';

export const NotificationParam = {
  info: {
    autoClose: 2000, closeButton: false, pauseOnHover: false
  }, success: {
    type: 'success', isLoading: false, autoClose: undefined, hideProgressBar: false
  }, stuck: {
    isLoading: false, closeButton: true, autoClose: false, hideProgressBar: true
  }
};


export default function App() {
  const { isOnline } = React.useContext(globalStateContext);

  async function validateUser(user?: MinecraftAccount, id?: number, reloadFunc?: () => any) {
    return new Promise<void>(async (resolve) => {
      const account = user !== undefined ? user : await window.electron.ipcRenderer.invoke('Auth:getSelectedAccount', {});
      const accountId = id !== undefined ? id : await window.electron.ipcRenderer.invoke('Auth:getSelectedId', {});
      console.log(prefix + `Verifying user ${account?.profile?.name} (storage id: ${accountId})`);
      if (account === undefined || account === null) {
        //Auth new
        // @ts-ignore
        const notificationId = toast.info('Hi, please log-in a Minecraft account', Object.assign(NotificationParam.stuck, { closeButton: false }));
        //closeable is false, so error can't be returned
        // @ts-ignore
        await addAccount(await getLogin({ closable: false }));
        toast.dismiss(notificationId);
        resolve();
      } else {
        //if account exist
        const notificationId = toast.loading(`Checking your account ${account.profile.name}...`);
        if (await window.electron.ipcRenderer.invoke('Auth:checkAccount', { user: account }) === false) {
          console.log(prefix + `Account ${account.profile.name} is not valid`);
          const res = await window.electron.ipcRenderer.invoke('Auth:refreshUser', { userId: accountId });
          if (res === KnownAuthErrorType.CannotRefreshAccount) {
            //if we couldn't refresh Account
            console.log(prefix + 'Cannot re-auth account');
            if (!isOnline) {
              //if we know the user will not be able to re-auth new user
              // @ts-ignore
              toast.update(notificationId, Object.assign(NotificationParam.stuck, {
                render: `We couldn't refresh your account ${account.profile.name} because you are offline, some functionalities may not work correctly !`,
                type: 'warning'
              }));
            } else {
              // @ts-ignore
              toast.update(notificationId, Object.assign(NotificationParam.stuck, {
                render: `We couldn't refresh data from your account ${account.profile.name}, please re-login as new`,
                type: 'warning'
              }));
              await window.electron.ipcRenderer.invoke('Auth:LogOut', { accountIndex: accountId });
              if (reloadFunc) reloadFunc();
            }
            resolve();
          } else {
            console.log(prefix + `Re authed account ${account.profile.name}`);
            toast.update(notificationId, Object.assign(NotificationParam.success, {
              render: 'Hi ' + account.profile.name, autoClose: 1500, closeButton: false, pauseOnHover: false
            }));
            resolve();
          }
        } else {
          console.log(prefix + `Account ${account.profile.name} is valid`);
          toast.update(notificationId, Object.assign(NotificationParam.success, {
            render: 'Switched to ' + account.profile.name, autoClose: 1500, closeButton: false, pauseOnHover: false
          }));
          resolve();
        }
      }
    });
  }

  const content = (<Loader
    content={async () => {
      const interfaceData = await window.electron.ipcRenderer.invoke('getData', { dataPath: 'interface' });

      const selectedTab = interfaceData.selectedTab !== undefined ? interfaceData.selectedTab : 'vanilla';
      const collapsed = interfaceData.isMenuCollapsed !== undefined ? interfaceData.isMenuCollapsed : true;
      console.log(prefix + 'Selected Tab: ' + interfaceData.selectedTab);

      const content: TabParams[] = [{
        id: 'vanilla', iconPath: grassBlockImg, content: VanillaView
      }, {
        id: 'settings', iconPath: settingIcon, style: { position: 'absolute', bottom: '10px' }, content: SettingsView
      }];


      return (<div id={'MAIN'}>
        <Loader content={async (reload) => {
          window.electron.ipcRenderer.on('Auth:CheckAccountProcess', // @ts-ignore
            ({ user, id }: { user: MinecraftAccount, id: number }) => validateUser(user, id, reload));
          await validateUser(undefined, undefined, reload);
          return <AuthModule />;
        }} className={AuthModuleStyle.AuthModule} />
        <TabView
          contentList={content}
          selectedTabIndex={content.findIndex((e) => e.id === selectedTab)}
          params={{
            collapsable: true, collapsed: collapsed, onCollapseMenu: (collapseState) => {
              window.electron.ipcRenderer.sendMessage('updateData', {
                value: collapseState, dataPath: 'interface.isMenuCollapsed'
              });
            }, styleSettings: { orientation: 'Horizontal' }
          }}
        />
        <ToastContainer
          position='bottom-center'
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
          theme='dark'
        />
      </div>);
    }}
    style={{ width: '100%', height: '100%' }}
  />);
  toast.info('Loaded successfully', Object.assign(NotificationParam.info, { autoClose: 1000 }));
  return content;
}
