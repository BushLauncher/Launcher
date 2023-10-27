import defaultStyle from '../../css/defaultViewStyle.module.css';
import styles from '../../css/settingsViewStyle.module.css';
import background from '../../../assets/graphics/backgrounds/underwater.png';
import { Tabs } from 'antd';
import React from 'react';
import GeneralSettingsView from './settings/GeneralSettingsView';
import ProfileSettingsView from './settings/ProfileSettingsView';
import VersionSettingsView from './settings/VersionSettingsView';
import AboutView from './settings/AboutView';
import '../../css/Tabs-ant-override.css';


export default function SettingsView() {

  return <div className={styles.View}>
    <Tabs items={[
      { key: 'General', content: GeneralSettingsView() },
      { key: 'Profiles', content: ProfileSettingsView() },
      { key: 'Versions', content: VersionSettingsView() },
      { key: 'Notes', content: AboutView() }
    ].map(tab => {
      return {
        key: tab.key,
        label: <span style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}> <p>{tab.key}</p></span>,
        children: tab.content,
        type: 'card',
        closable: false
      };
    })} tabPosition={'left'} size={'large'} type={'line'} data-center={'true'} centered destroyInactiveTabPane />
  </div>;
}
