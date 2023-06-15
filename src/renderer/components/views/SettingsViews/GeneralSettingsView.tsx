import Input from '../../public/Input/Input';
import Loader from '../../public/Loader';
import { getAllTheme, getCurrentTheme, SetTheme } from '../../../scripts/ThemeManager';
import { Theme } from '../../../../internal/public/ThemePublic';
import Dropdown from '../../public/Input/Dropdown';
import React from 'react';
import Button, { ButtonType } from '../../public/Input/Button';
import ButtonStyle from '../../public/css/inputStyle.module.css';
import defaultStyle from './css/DefaultSettingsView.module.css';
import { toast } from 'react-toastify';

export default function GeneralSettingView() {
  return <div className={defaultStyle.View}>
    <Input input={
      <Loader content={() => new Promise((resolve, reject) => {
        getCurrentTheme().then(currentTheme => resolve(
          <Dropdown selected={getAllTheme().indexOf(currentTheme)} content={getAllTheme()} label={currentTheme}
                    onSelect={(option: string) => {
                      SetTheme(Theme[option as unknown as Theme]);
                    }} />
        ));
      })} className={undefined} style={undefined} />} label={'Theme'} />
    <Input
      input={<Button content={<p>Delete all local Data</p>} type={ButtonType.Rectangle} className={ButtonStyle.danger}
                     action={() => {
                       window.electron.ipcRenderer.invoke('deleteAll', {}).then((result: boolean) => {
                         if (result) {
                           toast.success('Deleted all user data !');
                         }

                       });
                     }} />} label={'User Data'} />
  </div>;
};
