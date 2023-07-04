import defaultStyle from './css/defaultViewStyle.module.css';
import styles from './css/settingsViewStyle.module.css';
import TabView from '../main/TabView/TabView';
import background from '../../../assets/graphics/backgrounds/underwater.png';
import GeneralSettingView from './SettingsViews/GeneralSettingsView';
import ProfileSettingsView from './SettingsViews/ProfileSettingsView';
import AboutView from './SettingsViews/AboutView';
import VersionSettingsView from './SettingsViews/VersionSettingsView';
import { TabParam } from '../main/TabView/Tab';
import { PublicViewAdditionalProps, ViewProps } from '../public/View';


export default function SettingsView(props?: PublicViewAdditionalProps): ViewProps {
  const content: TabParam[] = [
    {
      id: 'general',
      displayName: 'General',
      // @ts-ignore
      content: GeneralSettingView()
    }, {
      id: 'profiles',
      displayName: 'Profiles',
      // @ts-ignore
      content: ProfileSettingsView()
    },
    {
      id: 'versions',
      displayName: 'Game Versions',
      // @ts-ignore
      content: VersionSettingsView()
    },
    {
      id: 'notes',
      displayName: 'Notes',
      // @ts-ignore
      content: AboutView()
    }
  ];
  return Object.assign( {
    content: (<div className={defaultStyle.Main} style={{ padding: 0 }}>
      <TabView tabList={content}
               className={styles.tabview}
               params={{
                 collapsable: false,
                 styleSettings: {
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
    </div>)
  }, props);
}
