import defaultStyle from './css/defaultViewStyle.module.css';
import styles from './css/settingsViewStyle.module.css';
import TabView, { TabParams } from '../main/TabView/TabView';
import background from '../../../assets/graphics/backgrounds/underwater.png';
import GeneralSettingView from './SettingsViews/GeneralSettingsView';
import ProfileSettingsView from './SettingsViews/ProfileSettingsView';
import AboutView from './SettingsViews/AboutView';
import VersionSettingsView from './SettingsViews/VersionSettingsView';

export default function SettingsView() {
  const content: TabParams[] = [{
    id: 'general',
    displayName: 'General',
    // @ts-ignore
    content: GeneralSettingView
  }, {
    id: 'profiles',
    displayName: 'Profiles',
    // @ts-ignore
    content: ProfileSettingsView
  },
    {
      id: 'versions',
      displayName: 'Game Versions',
      // @ts-ignore
      content: VersionSettingsView
    },
    {
      id: 'notes',
      displayName: 'Notes',
      // @ts-ignore
      content: AboutView
    }
  ];
  return (<div className={defaultStyle.Main} style={{ padding: 0 }}>
    <TabView contentList={content}
             className={styles.tabview}
             params={{
               collapsable: false,
               style: {
                 orientation: 'Horizontal',
                 tabAlign: 'Center',
                 navBarBackgroundVisibility: false,
                 tabSelectionEffect: 'Underline'
               }
             }} />

    <div
      style={{
        backgroundImage: `url(${background})`
      }}
      className={defaultStyle.BackgroundImage}
    />
  </div>);
}
