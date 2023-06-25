import InputGroup from '../../public/Input/InputGroup';
import Loader from '../../public/Loader';
import { getAllTheme, getCurrentTheme, SetTheme } from '../../../scripts/ThemeManager';
import { Theme } from '../../../../public/ThemePublic';
import React from 'react';
import defaultStyle from './css/DefaultSettingsView.module.css';
import { toast } from 'react-toastify';
import { Button, Select } from 'antd';

const { Option } = Select;

function requestDeleteAll() {
  window.electron.ipcRenderer.invoke('deleteAll', {}).then((result: boolean) => {
    if (result) {
      toast.success('Deleted all user data !');
    }
  });
}

export default function GeneralSettingView() {
  return <div className={defaultStyle.View}>
    <InputGroup input={
      <Loader content={() => new Promise((resolve, reject) => {
        getCurrentTheme().then(currentTheme => resolve(
          <Select defaultValue={currentTheme} onChange={val => SetTheme(val)} style={{ fontSize: '3vw' }}
                  size={'large'}>
            {getAllTheme().map(theme => <Option key={theme}>{theme}</Option>)}
          </Select>
        ));
      })} className={undefined} style={undefined} />} label={'Theme'} />
    <InputGroup
      //TODO: Add popover
      input={<Button type={"primary"} content={'Delete all local Data'} onInput={(e) => requestDeleteAll()} danger size={'large'}>Delete all local Data</Button>}
      label={'User Data'} />
  </div>;
};
