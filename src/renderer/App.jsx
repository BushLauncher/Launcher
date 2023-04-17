import TabView, { build } from './components/main/TabView/TabView';
import './defaultStyle.css';
import grassBlockImg from '../assets/graphics/images/grass_block.png';
import settingIcon from '../assets/graphics/icons/settings.svg';
import VanillaView from './components/views/vanillaView';
import Loader from './components/public/Loader';
import NotificationModuleProvider from './components/main/Notification/NotificationModuleProvider';
import { toast, ToastContainer } from 'react-toastify';

export const NotificationManager = new NotificationModuleProvider({});
export default function App() {
  const getSelectedTab = () => {
    return new Promise((resolve, reject) => {
      window.electron.ipcRenderer
        .invoke('getData', { path: 'interface.selectedTab' })
        .then((selectedTab) => {
          console.log('Selected Tab: ' + selectedTab);
          const content = [
            build({
              id: 'vanilla',
              iconPath: grassBlockImg,
              content: VanillaView,
            }),
            build({
              id: 'test',
            }),
            build({
              id: 'settings',
              iconPath: settingIcon,
              customStyle: { position: 'relative', top: '59%' },
            }),
          ];

          resolve(
            <div id={'MAIN'}>
              <TabView
                style={{ pos: 'left' }}
                contentList={content}
                selectedTabIndex={content.findIndex(
                  (e) => e.id === selectedTab
                )}
                params={{
                  collapsable: true,
                  collapsed: true,
                }}
              />
              <ToastContainer
                position="bottom-center"
                autoClose={5000}
                hideProgressBar
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable={false}
                pauseOnHover
                theme="dark"
              />
            </div>
          );
        });
    });
  };
  const param = {
    position: 'bottom-center',
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: false,
    progress: undefined,
    theme: 'dark',
  };
  toast('🦄 Wow so easy!', param);
  toast.success('Success', param);
  toast.info('Info', param);
  toast.warn('Warn', param);
  toast.error('Error', param);
  toast.promise(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  },     {
    pending: 'Promise is pending',
    success: 'Promise resolved 👌',
    error: 'Promise rejected 🤯'
  });
  return (
    <Loader
      content={getSelectedTab}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
