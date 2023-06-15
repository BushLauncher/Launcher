import Input from '../../public/Input/Input';
import Loader from '../../public/Loader';
import Button, { ButtonType } from '../../public/Input/Button';
import { useState } from 'react';
import styles from './css/VersionSettingsViewStyle.module.css';
import defaultStyle from './css/DefaultSettingsView.module.css';
import { VersionData } from '../../../../internal/public/GameData';
import TabView, { TabParams } from '../../main/TabView/TabView';

const enum states {
  normal,
  writing,
  loading,
  error
}

export default function VersionSettingsView() {
  const [state, setState] = useState(states.normal);
  const getLocalRootPath = async (): Promise<string> => {
    return await window.electron.ipcRenderer.invoke('GameEngine:getRootPath', {});
  };

  function submit(newPath: string | null) {

  }

  return (<div className={defaultStyle.View}>
    <Loader content={async () => (
      <Input input={
        <div className={styles.pathSelector}>
          <textarea className={styles.textArea} defaultValue={await getLocalRootPath()}
                    onInput={() => setState(states.writing)} />
          <div className={styles.buttonContainer}>
            <Button action={() => setState(states.writing)} content={<p>Submit</p>} type={ButtonType.StyleLess} />
            <Button action={() => submit(null)} content={<p>Reset</p>} type={ButtonType.StyleLess} />
          </div>
        </div>} />)
    } className={styles.pathSelector} style={undefined} />
    <div className={styles.VersionTool}>
      <Loader content={async () => {
        return new Promise((resolve, reject) => {
          window.electron.ipcRenderer.invoke('Version:getList', {})
            .then((list: VersionData[]) => {
              const tabList: TabParams[] = [];
              list.map((version: VersionData) => {
                if (tabList.find(savedTab => savedTab.id === version.gameType) === undefined) {
                  tabList.push({
                  // @ts-ignore
                    id: version.gameType, displayName: version.gameType, content: function(props): ReactElement {
                      return (<div></div>);
                      //TODO: Version Card
                    }
                  });
                }
              });
              console.log(tabList);
              resolve(<TabView contentList={tabList}
                               params={{
                                 collapsable: false,
                                 collapsed: true,
                                 style: { orientation: 'Vertical', navBarBackgroundVisibility: false }
                               }} />);
            })
            .catch(err => console.error(err));
        });

      }} className={styles.VersionTool} style={undefined} />
    </div>
  </div>);
}
