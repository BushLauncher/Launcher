import './defaultStyle.css';
import Loader from './components/public/Loader';
import { toast, ToastContainer } from 'react-toastify';
import AuthModule, { addAccount, getLogin } from './components/main/Auth/AuthModule';
import AuthModuleStyle from './components/main/Auth/css/AuthModuleStyle.module.css';
import { KnownAuthErrorType } from '../public/ErrorPublic';
import React, { useState } from 'react';
import { defaultTheme, globalStateContext } from './index';
import { MinecraftAccount } from '../public/AuthPublic';
import { ConfigProvider, Layout, Modal, Popover, Tabs } from 'antd';
import Icon from './components/public/Icons/Icon';
import { StyleProvider } from '@ant-design/cssinjs';


import dirtBlockIcon from '../assets/graphics/images/grass_block.png';
import settingsIcon from '../assets/graphics/icons/settings.svg';
import VanillaView from './components/views/vanillaView';
import './css/Tabs-ant-override.css';
import CollapsableSider from './components/public/CollapsableSider';

import { CapitalizeFirst } from '../public/Utils';
import SettingsView from './components/views/SettingsViews/SettingsView';
import './components/views/SettingsViews/css/SettingsModal-ant-override.css';
import { RunningVersion, RunningVersionState } from '../public/GameDataPublic';
import loadingIcon from '../assets/graphics/icons/loading.svg';
import playIcon from '../assets/graphics/icons/caret-right.svg';
import RenderConsoleManager, { ProcessType } from '../public/RenderConsoleManager';

const Sider = Layout.Sider;


const console = new RenderConsoleManager("app", ProcessType.Render);

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


  function saveSelectedView(id: string) {
    window.electron.ipcRenderer.sendMessage('updateData', {
      dataPath: 'interface.selectedTab',
      value: id
    });
  }


  async function validateUser(user?: MinecraftAccount, id?: number, reloadFunc?: () => any) {
    return new Promise<void>(async (resolve) => {
      const account = user !== undefined ? user : await window.electron.ipcRenderer.invoke('Auth:getSelectedAccount', {});
      const accountId = id !== undefined ? id : await window.electron.ipcRenderer.invoke('Auth:getSelectedId', {});
      console.log(`Verifying user ${account?.profile?.name} (storage id: ${accountId})`);
      if (account === undefined || account === null) {
        //Auth new
        // @ts-ignore
        const notificationId = toast.info('Hi, please log-in a Minecraft account', Object.assign(NotificationParam.stuck, { closeButton: false }));
        //closeable is false, so error can't be returned
        //@ts-ignore
        await addAccount(await getLogin({ closable: false }));
        toast.dismiss(notificationId);
        resolve();
      } else {
        //if account exist
        const notificationId = toast.loading(`Checking your account ${account.profile.name}...`);
        if (await window.electron.ipcRenderer.invoke('Auth:checkAccount', { user: account }) === false) {
          console.log(`Account ${account.profile.name} is not valid`);
          const res = await window.electron.ipcRenderer.invoke('Auth:refreshUser', { userId: accountId });
          if (res === KnownAuthErrorType.CannotRefreshAccount) {
            //if we couldn't refresh Account
            console.log('Cannot re-auth account');
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
            console.log(`Re authed account ${account.profile.name}`);
            toast.update(notificationId, Object.assign(NotificationParam.success, {
              render: 'Hi ' + account.profile.name, autoClose: 1500, closeButton: false, pauseOnHover: false
            }));
            resolve();
          }
        } else {
          console.log(`Account ${account.profile.name} is valid`);
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

      return (<div id={'MAIN'}>
        <Loader content={async (reload) => {
          window.electron.ipcRenderer.on('Auth:CheckAccountProcess', // @ts-ignore
            ({ user, id }: { user: MinecraftAccount, id: number }) => validateUser(user, id, reload));
          await validateUser(undefined, undefined, reload);
          return <AuthModule />;
        }} className={AuthModuleStyle.AuthModule} />
        <SettingsContext saveSelectedView={saveSelectedView} validateUser={validateUser} />
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

interface SettingsContextProps {
  saveSelectedView: (id: string) => any,
  validateUser: (user?: MinecraftAccount, id?: number, reloadFunc?: () => any) => Promise<void>
}

function SettingsContext({ saveSelectedView, validateUser }: SettingsContextProps) {
  const [open, setOpen] = useState(false);
  return <>
    <Loader content={async () => {
      const interfaceData = await window.electron.ipcRenderer.invoke('getData', { dataPath: 'interface' });
      const selectedTab: string = interfaceData.selectedTab !== undefined ? interfaceData.selectedTab : 'vanilla';

      return <Layout style={{ width: '100%', height: '100%' }}>
        <Tabs
          items={[
            { key: 'vanilla', icon: dirtBlockIcon, content: VanillaView({ key: 'vanilla' }) },

          ].map(tab => {
            return {
              key: tab.key,
              label:
                <Popover content={CapitalizeFirst(tab.key)} placement={'right'}>
                    <span>
                      <Icon icon={tab.icon} />
                      <p>{CapitalizeFirst(tab.key)}</p>
                      <Loader content={async (reload) => {
                        window.electron.ipcRenderer.once('UpdateMainTabsState', reload);
                        const list: RunningVersion[] = await window.electron.ipcRenderer.invoke('GameEngine:getRunningList', {});
                        const version = list.find((rv) => rv.id === tab.key);
                        if (version === undefined) return <></>;
                        else return <Icon
                          icon={version.State === RunningVersionState.Launching ? loadingIcon : playIcon} />;
                      }} className={'State'} />
                    </span>
                </Popover>,
              children: tab.content,
              type: 'card',
              closable: false
            };
          })}
          tabPosition={'left'}
          type={'card'}
          tabBarGutter={5}
          defaultActiveKey={selectedTab}
          className={'HideOperation scrollable'}
          renderTabBar={(props, DefaultNavBar) => {
            return (
              <CollapsableSider
                defaultCollapsed={interfaceData['isMenuCollapsed']}
                onCollapse={(isCollapsed: boolean) =>
                  window.electron.ipcRenderer.sendMessage('updateData', {
                    dataPath: 'interface.isMenuCollapsed',
                    value: isCollapsed
                  })

                }
                content={(collapsed) =>
                  <>
                    <DefaultNavBar {...props}
                                   className={[collapsed ? 'collapsed' : undefined, props.tabPosition === 'left' ? 'Vertical' : undefined, 'mainNavBar'].join(' ')} />
                    <div className={['extra', collapsed ? 'collapsed' : undefined].join(' ')}>
                      <Popover content={'Settings'} placement={'right'}>
                        <button onClick={() => setOpen(true)}>
                          <Icon icon={settingsIcon} />
                          <p>Settings</p>
                        </button>
                      </Popover>
                    </div>
                  </>}
              />
            );
          }
          }
          onChange={saveSelectedView} />
      </Layout>;
    }} />
    <ConfigProvider theme={defaultTheme}>
      <StyleProvider hashPriority={'high'}>
        <Modal className={'SettingsModal'} zIndex={50} open={open} onCancel={() => setOpen(false)} footer={null}
               centered title={<p>Settings</p>} width={'100%'}
               okText={'Save'} cancelText={'Close'} style={{ marginTop: '6vh' }}>{SettingsView()}</Modal>
      </StyleProvider>
    </ConfigProvider>
  </>;


}
