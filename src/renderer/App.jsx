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
import { knownAuthError } from '../internal/public/AuthPublic';

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


async function validateUser() {
  return new Promise(async (resolve, reject) => {
    const account = await window.electron.ipcRenderer.invoke('Auth:getSelectedAccount', {});
    const accountId = await window.electron.ipcRenderer.invoke('Auth:getSelectedId', {});

    const AuthNewAccount = async (toastId, add) => {
      if (toastId === undefined) toastId = toast.info('Hi, please log-in a Minecraft account', {
        autoClose: false,
        hideProgressBar: true,
        closeButton: false
      });
      const loggedUser = await getLogin({ closable: false });
      if (add === undefined || add) await addAccount(loggedUser);
      toast.dismiss(toastId);
      resolve();
    };


    if (account === undefined) resolve(await AuthNewAccount());
    else {
      const notificationId = toast.loading('Checking your account ' + account.profile.name + '...', { toastId: 'AuthChecker' });
      const res = await window.electron.ipcRenderer.invoke('Auth:refreshUser', { userId: accountId });
      if (res === knownAuthError.CannotRefreshAccount) {
        toast.update(notificationId, {
          render: `Cannot re-auth your account ${account.profile.name}, please login an account`,
          autoClose: false,
          hideProgressBar: true,
          closeButton: false,
          isLoading: false,
          type: 'warning'
        });
        await window.electron.ipcRenderer.invoke('Auth:LogOut', { accountIndex: accountId });
        resolve(await AuthNewAccount('AuthChecker', true));
      } else {
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

    }
  });
}

export default function App() {
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
                  <Loader content={async () => {
                    await validateUser();
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
