import TabView from './components/main/TabView/TabView';
import './defaultStyle.css';
import grassBlockImg from '../assets/graphics/images/grass_block.png';
import settingIcon from '../assets/graphics/icons/settings.svg';
import VanillaView from './components/views/vanillaView';
import Loader from './components/public/Loader';
import { toast, ToastContainer } from 'react-toastify';
import SettingsView from './components/views/SettingsView';
import AuthModule from './components/main/Auth/AuthModule';

export const defaultNotificationParams = {
  position: 'bottom-center',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: false,
  progress: undefined,
  theme: "dark"
};
export default function App() {
  return (
    <Loader
      content={() => {
        return new Promise((resolve, reject) => {
          window.electron.ipcRenderer
            .invoke('getData', { dataPath: 'interface.selectedTab' })
            .then((selectedTab) => {
              selectedTab = selectedTab !== undefined ? selectedTab : 'vanilla';
              console.log('Selected Tab: ' + selectedTab);

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
              toast.info('Loaded successfully', {
                ...defaultNotificationParams,
                ...{ autoClose: 2000, closeButton: false, pauseOnHover: false }
              });
              resolve(
                <div id={'MAIN'}>
                  <AuthModule />
                  <TabView
                    contentList={content}
                    selectedTabIndex={content.findIndex(
                      (e) => e.id === selectedTab
                    )}
                    params={{ collapsable: true, collapsed: true, style: { orientation: 'Horizontal' } }}
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
            });
        });
      }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
