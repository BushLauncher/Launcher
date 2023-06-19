import InputGroup from '../../public/Input/InputGroup';
import Loader from '../../public/Loader';
import { useState } from 'react';
import styles from './css/VersionSettingsViewStyle.module.css';
import defaultStyle from './css/DefaultSettingsView.module.css';
import { GameType, VersionData } from '../../../../internal/public/GameData';
import TabView, { TabParams } from '../../main/TabView/TabView';
import { AutoComplete } from 'antd';
import Icon from '../../public/Icons/Icon';
import crossIcon from '../../../../assets/graphics/icons/close.svg';
import doneIcon from '../../../../assets/graphics/icons/done.svg';
import loadIcon from '../../../../assets/graphics/icons/loading.svg';
import vanillaIcon from '../../../../assets/graphics/images/grass_block.png';
import VersionCard from '../../public/VersionCard';
import EmptyView from '../emptyView';

const { Option } = AutoComplete;

const enum states {
  normal,
  loading,
  valid,
  error
}

export function getGameTypeIcon(gameType: GameType) {
  switch (gameType) {
    case GameType.VANILLA:
      return vanillaIcon;
    default:
      return vanillaIcon;
  }
}

export default function VersionSettingsView() {
  return (
    <Loader content={async (reload: () => any) => {
      // @ts-ignore
      const VersionTool = (): Promise<JSX.Element> => new Promise((resolve) => {
        console.log('execute promise');
        const tabList: TabParams[] = [];
        window.electron.ipcRenderer.invoke('Version:getTypeList', {})
          .then((gameTypeList: string[]) => {
            const construct = gameTypeList.map(async (gameType) => {
              //get all versions from this gameType
              await window.electron.ipcRenderer.invoke('Version:getList', { gameType: gameType, type: 'local' })
                .then((versionList: VersionData[]) => {
                  tabList.push({
                    id: gameType,
                    iconPath: getGameTypeIcon(gameType as unknown as GameType),
                    displayName: gameType,
                    /*@ts-ignore */
                    content: versionList.length === 0 ? EmptyView() : (
                      <div className={styles.scrollable}>
                        {versionList.map((version, i) => <VersionCard version={version} key={i}
                                                                      toolBox={{
                                                                        diagnose: true,
                                                                        uninstall: true,
                                                                        reinstall: true,
                                                                        callback: () => reload()
                                                                      }} className={styles.card} />)}
                      </div>
                    )
                  });
                });
            });
            Promise.all(construct).then(() => {
              console.log('resolved');
              resolve(<TabView contentList={tabList} params={{
                collapsable: false,
                collapsed: true,
                style: { orientation: 'Vertical', navBarBackgroundVisibility: false }
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
    }} className={[defaultStyle.View, styles.View].join(' ')} style={undefined} />);
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
        return null;
    }

  };
  return (
    <Loader content={async () => {
      const saved: string = await window.electron.ipcRenderer.invoke('GameEngine:getRootPath', {});
      const defaultPath: string = await window.electron.ipcRenderer.invoke('GameEngine:getDefaultRootPath', {});
      return (
        <InputGroup label={'minecraft folder path'} input={
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
