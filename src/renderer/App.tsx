import './css/defaultStyle.css';
import Loader from './components/public/Loader';
import React from 'react';
import './css/Tabs-ant-override.css';
import './css/SettingsModal-ant-override.css';
import RenderConsoleManager, { ProcessType } from '../global/RenderConsoleManager';
import { Configuration } from '../types/Configuration';
import { toast } from 'react-toastify';
import { Account, AccountCheckOperationResponse, MSAccount } from '../types/AuthPublic';
import { App as AntdApp } from 'antd';
import AuthManager from './components/main/Auth/AuthManager';
import AuthModule from './components/main/Auth/AuthModule';


const console = new RenderConsoleManager('app', ProcessType.Render);


/**export default function App() {
 const { isOnline } = React.useContext(globalStateContext);
 console.log(window.version.app());

 function saveSelectedView(id: string) {
 window.electron.ipcRenderer.sendMessage('updateData', {
 dataPath: 'interface.selectedTab', value: id
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

 const content = (
 <Loader
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
 const configs: Configuration[] = await window.electron.ipcRenderer.invoke('Configs:getAll', {});

 function compileConfigurations(configList: Configuration[]): TabsProps['items'] {
 const TabList: TabsProps['items'] = [];
 function constructTab(id: string, name: string, icon: ConfigurationIcon, content: ReactElement | Configuration){
 return {
 key: id, label: (
 <Popover content={CapitalizeFirst(name)} placement={'right'}>
 <span>
 <GameIcon icon={icon} />
 <p>{CapitalizeFirst(name)}</p>
 <Loader content={async (reload) => {
 window.electron.ipcRenderer.once('UpdateMainTabsState', reload);
 const list: RunningVersion[] = await window.electron.ipcRenderer.invoke('GameEngine:getRunningList', {});
 const version = list.find((rv) => rv.id === id);
 if (version === undefined) return <></>; else {
 function getConfigurationStateIcon(versionState: RunningVersionState) {
 switch (versionState) {
 case RunningVersionState.Launching:
 return loadingIcon;
 case RunningVersionState.Running:
 return playIcon;
 default:
 console.raw.error('Cannot find icon for ' + versionState);
 }
 }

 const icon = getConfigurationStateIcon(version.State);
 return <Icon icon={icon} />;
 }
 }} className={'State'} />
 </span>
 </Popover>
 ),
 children: React.isValidElement(content) ? content : ConfigurationView({ configuration: content as Configuration }), closable: false
 }
 }
 //Add defaults Tabs
 TabList.push(constructTab("vanilla", "Vanilla", {type: 'Local', data: ConfigurationLocalIcon.dirt}, VanillaView({key: 'vanilla' })))
 //Add Tabs from registered configurations
 configList.map((config) => {
 TabList.push(constructTab(config.id, config.name, config.icon, config));
 });
 return TabList;
 }

 return <Layout style={{ width: '100%', height: '100%' }}>
 <Tabs
 items={configs.length > 0 ? compileConfigurations(configs) : [{
 key: '',
 children: <Empty description={'Please create a Configuration to start.'} />,
 label: ''
 }]}
 tabPosition={'left'}
 type={'card'}
 tabBarGutter={5}
 defaultActiveKey={selectedTab}
 className={'HideOperation scrollable'}
 renderTabBar={(props, DefaultNavBar) => {
 return (<CollapsableSider
 defaultCollapsed={interfaceData['isMenuCollapsed']}
 onCollapse={(isCollapsed: boolean) => window.electron.ipcRenderer.sendMessage('updateData', {
 dataPath: 'interface.isMenuCollapsed', value: isCollapsed
 })}
 content={(collapsed) => <>
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
 />);
 }}
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


 }*/


export default function App() {
  //Check for update frontend listener

  //Account frontend listener
  const authManager = new AuthManager();
  const accountValidateOperation = toast.loading('Checking account...', { toastId: 'accountValidateOperationToast' });
  const handleAccountCheckOperationCallback = async (response: AccountCheckOperationResponse) => {
    switch (response) {
      case 'mustLogin': {
        console.log('User must login...');
        setTimeout(() =>
          toast.update(accountValidateOperation, {
            render: 'Hi, Please log in an account',
            type: 'info',
            isLoading: false
          }), 1000);
        authManager.LoginNew()
          .then((account: Account) => {
            //local returned account is re-fetched
            handleAccountCheckOperationCallback('done');
          }).catch(() => handleAccountCheckOperationCallback('couldntRevalidate'));
        break;
      }
      case 'couldntRevalidate': {
        console.error('Couldn\'t revalidate user');
        setTimeout(() =>
          toast.update(accountValidateOperation, {
            render: 'We couldn\'t refresh you account, please re-connect it',
            type: 'warning',
            isLoading: false
          }), 1000);
        authManager.LoginNew().then((account: Account) => {
          //local returned account is re-fetched
          handleAccountCheckOperationCallback('done');
        }).catch(() => handleAccountCheckOperationCallback('couldntRevalidate'));
        break;
      }
      case 'validating': {
        console.log('Validating user...');
        setTimeout(() => toast.update(accountValidateOperation, { render: 'Refreshing account...' }), 1000);
        break;
      }
      case 'done': {
        //refresh in case of re login
        await authManager.refreshData();
        const account = authManager.getSelected();
        if (account === null) throw new Error('Cannot render null account');
        else {
          console.log('Logged as  ' + account.name);
          setTimeout(() => toast.update(accountValidateOperation, {
            render: 'Hi ' + account.name + ' !',
            isLoading: false,
            type: 'success',
            autoClose: 3000,
            hideProgressBar: true
          }), 1000);
        }
        break;
      }
    }
  };
  //@ts-ignore
  window.electron.ipcRenderer.on('Starting:AccountCheckOperation', handleAccountCheckOperationCallback);
  //
  return (
    <div id={'App'}>
      <AuthModule authManager={authManager} />
      <Loader /*Load all configurations*/>
        {async (reload) =>
          new Promise((resolve, reject) => {
            // @ts-ignore
            window.electron.ipcRenderer.on('Starting:ConfigurationsReceive', (configurationList: Configuration[]) => {
              resolve(
                <div>
                  {configurationList.map(c => {
                    return <div key={c.id}>{c.name}</div>;
                  })}
                </div>
              );
            });
          })
        }
      </Loader>
    </div>
  );
}
