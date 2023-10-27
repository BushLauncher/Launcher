import LabeledInput from '../../public/Input/LabeledInput';
import Loader from '../../public/Loader';
import { getAllTheme, getCurrentTheme, SetTheme } from '../../../../global/ThemeManager';
import React from 'react';
import defaultStyle from '../../../css/DefaultSettingsView.module.css';
import { toast } from 'react-toastify';
import { Button, Popover, Select } from 'antd';


const { Option } = Select;

function requestDeleteAll() {
  toast.promise(window.electron.ipcRenderer.invoke('Storage:DeleteAll', {}), {
    pending: 'Deleting local data...',
    error: 'Unexpected Error',
    success: 'Deleted all user data !'
  });
}

function requestCatchClean() {
  toast.promise(window.electron.ipcRenderer.invoke('Storage:CleanCatch', {}), {
    pending: 'Cleaning catch...',
    error: 'Unexpected Error',
    success: 'Catch cleaned up !'
  });
}

function requestDeleteJava() {
  toast.promise(window.electron.ipcRenderer.invoke('Storage:DeleteJava', {}), {
    pending: 'Deleting Java...',
    error: 'Unexpected Error',
    success: 'Java deleted !'
  });
}

export default function GeneralSettingsView() {
  return <div className={defaultStyle.View}>
    <LabeledInput label={'Theme'}>
      <Loader content={async () => {
        const currentTheme = await getCurrentTheme();
        return (
          <Select defaultValue={currentTheme} onChange={val => SetTheme(val)}
                  style={{ fontSize: '3vw' }}>
            {getAllTheme().map(theme => <Option key={theme}>{theme}</Option>)}
          </Select>);
      }} />
    </LabeledInput>
    <LabeledInput label={'Files'}>
      <Popover content={'Cleanup download catch'}>
        <Button onClick={() => requestCatchClean()}>Clean catch</Button>
      </Popover>
      <Popover content={'Remove local version of Java'}>
        <Button onClick={() => requestDeleteJava()}>Delete Java</Button>
      </Popover>
      <Popover content={'Delete all local data and restart app'}>
        <Button content={'Delete all'} onClick={() => requestDeleteAll()} danger>Delete all</Button>
      </Popover>
    </LabeledInput>
  </div>;
}
