import LabeledInput from '../../public/Input/LabeledInput';
import Loader from '../../public/Loader';
import { useState } from 'react';
import styles from './css/VersionSettingsViewStyle.module.css';
import defaultStyle from './css/DefaultSettingsView.module.css';
import { GameType, GameVersion } from '../../../../public/GameDataPublic';
import TabView from '../../main/TabView/TabView';
import { AutoComplete } from 'antd';
import Icon from '../../public/Icons/Icon';
import crossIcon from '../../../../assets/graphics/icons/close.svg';
import doneIcon from '../../../../assets/graphics/icons/done.svg';
import loadIcon from '../../../../assets/graphics/icons/loading.svg';
import vanillaIcon from '../../../../assets/graphics/images/grass_block.png';
import VersionCard from '../../public/VersionCard';
import toDownloadIcon from '../../../../assets/graphics/icons/download.svg';
import View, { PublicViewAdditionalProps, ViewProps } from '../../public/View';
import { TabParam } from '../../main/TabView/Tab';

const { Option } = AutoComplete;

const enum states {
  normal,
  loading,
  valid,
  error
}

export function getInstalledIcon(installed: boolean | undefined) {
  return installed ? doneIcon : toDownloadIcon;
}

export function getGameTypeIcon(gameType: GameType) {
  switch (gameType) {
    case GameType.VANILLA:
      return vanillaIcon;
    default:
      return vanillaIcon;
  }
}


export default function VersionSettingsView(props?: PublicViewAdditionalProps): ViewProps {
  return Object.assign({
    content: (<Loader content={async (reload: () => any) => {
      // @ts-ignore
      const VersionTool = (): Promise<JSX.Element> => new Promise((resolve) => {
        const tabList: TabParam[] = [];
        window.electron.ipcRenderer.invoke('Version:getTypeList', {})
          .then((gameTypeList: string[]) => {
            const construct = gameTypeList.map(async (gameType) => {
              //get all versions from this gameType

              tabList.push({
                id: gameType,
                iconPath: getGameTypeIcon(gameType as unknown as GameType),
                displayName: gameType,
                /*@ts-ignore */
                content: {
                  content:
                    <Loader content={async (reload) => {
                      const versionList: GameVersion[] = await window.electron.ipcRenderer.invoke('Version:getList', { gameType: gameType/*, type: 'local'*/ }).catch(err => console.log(err));
                      return versionList.length === 0 ? new View({ content: undefined }).render() :
                        <div className={styles.scrollable}>
                          {versionList.map((version, i) =>
                            <VersionCard version={version} key={i} toolBox={{
                              diagnose: { active: true },
                              uninstall: { active: true, callback: reload },
                              install: { active: true, callback: reload }
                            }} className={styles.card} />)}
                        </div>;
                    }} className={styles.scrollable} />
                }

              });

            });
            Promise.all(construct).then(() => {
              resolve(<TabView tabList={tabList} params={{
                collapsable: false,
                collapsed: true,
                styleSettings: { orientation: 'Vertical', navBarBackgroundVisibility: false }
              }} className={styles.VersionTool} />);
            });
          }).catch(err => console.error(err));
      });
      const versionTool = await VersionTool();
      return (
        <div className={defaultStyle.View}>
          {versionTool}
          <PathInput callback={() => reload()} />
        </div>
      );
    }} className={[defaultStyle.View, styles.View].join(' ')} style={undefined} />)
  }, props);
}

function PathInput({ callback }: { callback: () => any }): JSX.Element {
  const [state, setState] = useState<states>(states.normal);
  const [content, _setContent] = useState<string>('');
  const [isInitialRender, setIsInitialRender] = useState(true);

  function setContent(val: string) {
    if (isInitialRender) setIsInitialRender(false);
    _setContent(val);

  }

  async function submit() {
    setState(states.loading);
    const res = await window.electron.ipcRenderer.invoke('Option:setRootPath', { path: content });
    if (res === false) {
      setState(states.error);
    } else {
      setState(states.valid);
      callback();
      setTimeout(() => setState(states.normal), 2000);
    }
  }

  const getIcon = () => {
    switch (state) {
      case states.error:
        return crossIcon;
      case states.valid:
        return doneIcon;
      case states.loading:
        return loadIcon;
      default:
        return undefined;
    }

  };
  return (
    <Loader content={async () => {
      const saved: string = await window.electron.ipcRenderer.invoke('GameEngine:getRootPath', {});
      const defaultPath: string = await window.electron.ipcRenderer.invoke('GameEngine:getDefaultRootPath', {});
      return (
        <LabeledInput label={'minecraft folder path'} input={
          <div className={styles.pathSelector}>
            {state !== states.normal && <Icon icon={getIcon()} className={styles.icon} />}
            <AutoComplete status={state === states.error ? 'error' : undefined}
                          disabled={state === states.loading}
                          size={'large'} className={styles.textArea}
                          value={isInitialRender ? saved : content}
                          placeholder={'\'.minecraft\' folder path'}
                          onChange={(val) => setContent(val)}
                          onSelect={() => submit()}
            >
              <Option key={isInitialRender ? saved : content}>{isInitialRender ? saved : content}</Option>
              {saved !== defaultPath && content !== defaultPath && <Option key={defaultPath}>{defaultPath}</Option>}
            </AutoComplete>

          </div>
        } />);
    }
    } className={styles.pathSelector} style={undefined} />
  );
}
