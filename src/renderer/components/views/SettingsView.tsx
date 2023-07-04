import defaultStyle from './css/defaultViewStyle.module.css';
import background from '../../../assets/graphics/backgrounds/underwater.png';


export default function SettingsView() {
  /*const content = [
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
  ];*/
  console.log("rerended Settings view");
  return <div className={defaultStyle.Main} style={{ padding: 0 }}>
    <div
      style={{
        backgroundImage: `url(${background})`
      }}
      className={defaultStyle.BackgroundImage}
    />
  </div>;
}
