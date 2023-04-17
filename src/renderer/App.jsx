import TabView, { build } from './components/main/TabView/TabView';
import './defaultStyle.css';
import grassBlockImg from '../assets/graphics/images/grass_block.png';
import settingIcon from '../assets/graphics/icons/settings.svg';
import VanillaView from './components/views/vanillaView';
import Loader from './components/public/Loader';
import NotificationModuleProvider from './components/main/Notification/NotificationModuleProvider';
import { toast, ToastContainer } from 'react-toastify';

export const NotificationManager = new NotificationModuleProvider({});

export const defaultNotificationParams = {
  position: 'bottom-center',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: false,
  progress: undefined,
  theme: 'dark',
};
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
          toast.info("Loaded successfully", {...defaultNotificationParams, ...{autoClose: 2000, closeButton: false, pauseOnHover: false}})
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
                hideProgressBar={false}
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

  return (
    <Loader
      content={getSelectedTab}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
