import TabView from './components/main/TabView/TabView';
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


export const NotificationParam = {
  info: {
    autoClose: 2000, closeButton: false, pauseOnHover: false
  },
  success: {
    type: 'success',
    isLoading: false,
    autoClose: undefined,
    hideProgressBar: false
  },
  stuck: {
    isLoading: false,
    closeButton: true,
    autoClose: false,
    hideProgressBar: true
  }

};


export default function App() {
  const { isOnline } = React.useContext(globalStateContext);

  async function validateUser(user, id, reloadFunc) {
    return new Promise(async (resolve, reject) => {
      const account = user !== undefined ? user : await window.electron.ipcRenderer.invoke('Auth:getSelectedAccount', {});
      const accountId = id !== undefined ? id : await window.electron.ipcRenderer.invoke('Auth:getSelectedId', {});
      console.log('Verifying user ' + account?.profile?.name + ' at ' + accountId);
      if (account === undefined || account === null) {
        //Auth new
        const notificationId = toast.info('Hi, please log-in a Minecraft account', {
          autoClose: false,
          hideProgressBar: true,
          closeButton: false
        });
        await addAccount(await getLogin({ closable: false }));
        toast.dismiss(notificationId);
        resolve();
      } else {
        const notificationId = toast.loading('Checking your account ' + account.profile.name + '...');
        if (await window.electron.ipcRenderer.invoke('Auth:checkAccount', { user: account }) === false) {
          console.log('account is not valid');
          const res = await window.electron.ipcRenderer.invoke('Auth:refreshUser', { userId: accountId });
          console.log(res);
          if (res === KnownAuthErrorType.CannotRefreshAccount) {
            console.log('Cannot re-auth account');
            if (!isOnline) {
              //if we know the user will not be able to re-auth new user
              toast.update(notificationId, {
                render: `We couldn't refresh your account ${account.profile.name} because you are offline, some functionalities may not work correctly !`,
                autoClose: false,
                hideProgressBar: true,
                closeButton: true,
                isLoading: false,
                type: 'warning'
              });
            } else {
              toast.update(notificationId, {
                render: `We couldn't refresh data from your account ${account.profile.name}, please re-login as new`,
                autoClose: false,
                hideProgressBar: true,
                closeButton: true,
                isLoading: false,
                type: 'warning'
              });
              await window.electron.ipcRenderer.invoke('Auth:LogOut', { accountIndex: accountId });
              reloadFunc();
            }
            resolve();
          } else {
            console.log('Re authed account');
            toast.update(notificationId, {
              render() {
                resolve();
                return 'Hi ' + account.profile.name;
              },
              autoClose: 1500,
              closeButton: false,
              pauseOnHover: false,
              isLoading: false,
              type: 'success'
            });
          }
        } else {
          console.log('account is valid');
          toast.update(notificationId, {
            render() {
              resolve();
              return 'Switched to ' + account.profile.name;
            },
            autoClose: 1500,
            closeButton: false,
            pauseOnHover: false,
            isLoading: false,
            type: 'success'
          });
        }
      }
    });
  }

  return (
    <Loader
      content={() => {
        return new Promise(async (resolve, reject) => {
          window.electron.ipcRenderer
            .invoke('getData', { dataPath: 'interface' })
            .then((interfaceData) => {
              const selectedTab = interfaceData.selectedTab !== undefined ? interfaceData.selectedTab : 'vanilla';
              const collapsed = interfaceData.isMenuCollapsed !== undefined ? interfaceData.isMenuCollapsed : true;
              console.log('Selected Tab: ' + interfaceData.selectedTab);

              const content = [
                {
                  id: 'vanilla',
                  iconPath: grassBlockImg,
                  content: VanillaView
                },
                {
                  id: 'settings',
                  iconPath: settingIcon,
                  style: { position: 'absolute', bottom: '10px' },
                  content: SettingsView
                }
              ];


              resolve(
                <div id={'MAIN'}>
                  <Loader content={async (reload) => {
                    window.electron.ipcRenderer.on('Auth:CheckAccountProcess',
                      ({ user, id }) => validateUser(user, id, reload));
                    await validateUser(undefined, undefined, reload);
                    return <AuthModule />;
                  }} className={AuthModuleStyle.AuthModule} />
                  <TabView
                    contentList={content}
                    selectedTabIndex={content.findIndex(
                      (e) => e.id === selectedTab
                    )}
                    params={{
                      collapsable: true, collapsed: collapsed, onMenuCollapsed: (collapseState) => {
                        window.electron.ipcRenderer.sendMessage('updateData', {
                          value: collapseState,
                          dataPath: 'interface.isMenuCollapsed'
                        });
                      }, style: { orientation: 'Horizontal' }
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
                </div>
              );
              toast.info('Loaded successfully', {
                autoClose: 1000, closeButton: false, pauseOnHover: false
              });
            });
        });
      }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
