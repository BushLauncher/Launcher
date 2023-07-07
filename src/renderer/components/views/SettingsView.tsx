import defaultStyle from './css/defaultViewStyle.module.css';
import background from '../../../assets/graphics/backgrounds/underwater.png';
import { Tabs } from 'antd';
import React from 'react';
import GeneralSettingsView from './SettingsViews/GeneralSettingsView';
import ProfileSettingsView from './SettingsViews/ProfileSettingsView';
import VersionSettingsView from './SettingsViews/VersionSettingsView';
import AboutView from './SettingsViews/AboutView';
import "../main/TabView/ant-override.css"


export default function SettingsView() {

  return <div className={defaultStyle.Main} style={{
    backgroundImage: `url(${background})`
  }}>
    <Tabs items={[
      { key: 'General', content: GeneralSettingsView() },
      { key: 'Profiles', content: ProfileSettingsView(), persistent: true },
      { key: 'Versions', content: VersionSettingsView() },
      { key: 'Notes', content: AboutView() }
    ].map(tab => {
      return {
        key: tab.key,
        label: <span style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}> <p>{tab.key}</p></span>,
        children: tab.content,
        type: 'card',
        closable: false,
        destroyInactiveTabPane: tab.persistent || false
      };
    })} tabPosition={'left'} size={'large'} type={"line"} data-center={"true"} className={"transparent"}  />
  </div>;
}
