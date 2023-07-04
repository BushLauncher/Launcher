import LabeledInput from '../../public/Input/LabeledInput';
import Loader from '../../public/Loader';
import { getAllTheme, getCurrentTheme, SetTheme } from '../../../../public/ThemeManager';
import { Theme } from '../../../../public/ThemePublic';
import React from 'react';
import defaultStyle from './css/DefaultSettingsView.module.css';
import { toast } from 'react-toastify';
import { Button, Popover, Select } from 'antd';
import { PublicViewAdditionalProps, ViewProps } from '../../public/View';

const { Option } = Select;

function requestDeleteAll() {
  window.electron.ipcRenderer.invoke('Storage:DeleteAll', {})
    .then(async (result: boolean) => {
      if (result) {
        toast.success('Deleted all user data !');
        await window.electron.ipcRenderer.invoke('App:Relaunch', {});
      }
    });
}

export default function GeneralSettingsView(props?: PublicViewAdditionalProps): ViewProps {
  return Object.assign({
    content: (<div className={defaultStyle.View}>
      <LabeledInput input={
        <Loader content={() => new Promise((resolve) => {
          getCurrentTheme().then(currentTheme => resolve(
            <Select defaultValue={currentTheme} onChange={val => SetTheme(val)} style={{ fontSize: '3vw' }}
                    size={'large'}>
              {getAllTheme().map(theme => <Option key={theme}>{theme}</Option>)}
            </Select>
          ));
        })} />} label={'Theme'} />
      <LabeledInput
        input={
          <Popover content={'Delete all local data and restart app'}>
            <Button type={'primary'} content={'Delete all'} onInput={() => requestDeleteAll()} danger
                    size={'large'}>Delete all</Button></Popover>}
        label={'Data'} />
    </div>)
  }, props);
}
