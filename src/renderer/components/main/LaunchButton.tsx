import styles from './css/LaunchButton.module.css';
import Icon from '../public/Icons/Icon';
import LaunchIcon from '../../../assets/graphics/icons/caret-right.svg';
import LoadingIcon from '../../../assets/graphics/icons/loading.svg';
import ErrorIcon from '../../../assets/graphics/icons/close.svg';
import downArrowIcon from '../../../assets/graphics/icons/arrow_down.svg';
import React, { useEffect, useState } from 'react';
import {
  Callback,
  CallbackType,
  ExitedCallback,
  ExitedReason,
  GameType,
  GameVersion,
  getDefaultGameType,
  getDefaultVersion,
  LaunchTaskState,
  PreloadCallback,
  ProgressCallback,
  RawLaunchProcess
} from '../../../public/GameDataPublic';
import Loader from '../public/Loader';
import { globalStateContext } from '../../index';
import { toast } from 'react-toastify';
import CallbackMessage from '../public/CallbackMessage';
import { ComponentsPublic } from '../ComponentsPublic';
import { Button, Divider, Popover, Progress } from 'antd';
import VersionCard, { CollapsableVersionCard } from '../public/VersionCard';
import OutsideAlerter from '../public/OutsideAlerter';
import { v4 as uuidv4 } from 'uuid';
import { GroupedGameVersions } from '../../../main/internal/VersionManager';
import RenderConsoleManager, { ProcessType } from '../../../public/RenderConsoleManager';

const console = new RenderConsoleManager('LaunchButton', ProcessType.Render);

export enum LaunchButtonState {
  Normal = 'Normal', Loading = 'Loading', Error = 'Error', Launched = 'Launched', Preparing = 'Preparing'
}


export type LoadingProgress = {
  currentStep: number, stepCount: number, progressVal: number, subText: string | undefined;
}

export interface LaunchButtonProps extends ComponentsPublic {
  id?: string,
  versionSelector: boolean,
  type?: 'square' | 'default',
  onRun?: (version: GameVersion) => any,
  onProgressCallback?: (callback: ProgressCallback) => any,
  onError?: (err: ExitedCallback | any) => any
  onExited?: (exitedCallback: ExitedCallback) => any
  onLaunched?: () => any
}

export default function LaunchButton(props: LaunchButtonProps) {
  const type = (props.type === undefined) ? 'default' : props.type;
  const { isOnline } = React.useContext(globalStateContext);

  const [isVersionSelectorOpened, setVersionSelector] = useState(false);
  const [state, setCurrentState] = useState(LaunchButtonState.Preparing);
  const [text, setDisplayText] = useState('Launch');
  const [progress, setProgress] = useState<LoadingProgress>({
    currentStep: -1,
    stepCount: 0,
    progressVal: 0,
    subText: undefined
  });
  let localStepPercentage: number = 0;
  const [storage, setStorage] = useState<undefined | GameVersion[]>(undefined);
  const [selectedVersion, Select] = useState<undefined | GameVersion>(undefined);
  const [tryingKill, setTryingKill] = useState(false);

  async function getSelected() {
    const s = await window.electron.ipcRenderer.invoke('Version:get', {});
    Select(s);
    return s;
  }

  function getIcon() {
    switch (state) {
      case LaunchButtonState.Error:
        return ErrorIcon;
      case LaunchButtonState.Normal:
      case LaunchButtonState.Launched:
        return LaunchIcon;
      case LaunchButtonState.Loading:
        return LoadingIcon;
    }
  }

  function requestLaunch(version: GameVersion) {
    const process: RawLaunchProcess = {
      id: props.id || uuidv4(), process: [], version: version, internal: true, allowCustomOperations: true
    };
    const channel = { callback: 'GameLaunchCallback:' + process.id, launch: 'GameEngine:Launch:' + process.id };
    setVersionSelector(false);
    setDisplayText('Initializing...');
    console.log('Requesting Launch...');
    window.electron.ipcRenderer.invoke('GameEngine:RequestLaunch', { id: process.id }).then(() => {
      console.log(`Listening on [${channel.callback} ]`);
      window.electron.ipcRenderer.sendMessage('App:setWinBar', ({ percentage: 0, options: { mode: 'indeterminate' } }));
      //Register callback
      //@ts-ignore
      window.electron.ipcRenderer.on(channel.callback, (callback: Callback) => {
        //console.raw.log(callback);
        decodeLaunchCallback(callback);
      });
      //Request Launch
      window.electron.ipcRenderer.invoke(channel.launch, { LaunchProcess: process })
        .then((exitedCallback: ExitedCallback) => {
          //console.raw.log(exitedCallback);
          window.electron.ipcRenderer.removeAllListeners(channel.callback);
          decodeLaunchCallback(exitedCallback);
        });

    });
  }

  function decodeLaunchCallback(_callback: Callback | ExitedCallback) {
    //avoid 0's array
    if (_callback.progressing?.stepId !== undefined) _callback.progressing.stepId += 1;
    switch (_callback.type) {
      case CallbackType.Progress: {
        const callback: ProgressCallback = _callback as unknown as ProgressCallback;
        if (props.onProgressCallback) props.onProgressCallback(callback);
        if (state !== LaunchButtonState.Loading) setCurrentState(LaunchButtonState.Loading);
        if (callback.task.displayText !== undefined) setDisplayText(callback.task.displayText);

        //add or update sub task
        const containLP = !(callback.task.data === undefined) && !(callback.task.data.localProgress === undefined);
        // @ts-ignore
        let lp: numer;
        const setLp = (): number => {
          switch (callback.task.state) {
            case LaunchTaskState.starting:
              return 0;
            case LaunchTaskState.finished:
              return 100;
            case LaunchTaskState.processing:
              //if(typeof callback.task.data !== undefined) throw new Error()
              // @ts-ignore
              return containLP ? callback.task.data.localProgress : localStepPercentage;
            case LaunchTaskState.error:
              return localStepPercentage;
          }
        };
        lp = setLp();
        // @ts-ignore
        //let calculatedProgress: number = ((100 * callback.progressing.stepId) + lp - 100) / callback.progressing.stepCount;
        const step = callback.progressing.stepId;
        const stepCount = callback.progressing.stepCount;
        let calculatedProgress: number = ((step - 1) / stepCount) * 100 + lp / stepCount;
        /*console.log(`((100 * ${callback.progressing.stepId}) - ${lp})/ ${callback.progressing.stepCount}
    = (${100 * callback.progressing.stepId} - ${lp})/ ${callback.progressing.stepCount})
    = (${(100 * callback.progressing.stepId) - lp})/ ${callback.progressing.stepCount})
    = ${calculatedProgress}`);*/
        //console.log(callback.progressing.stepId + ' + ' + lp + ' | ' + localStepPercentage + '  : ' + calculatedProgress + '\n', callback);
        if (containLP) localStepPercentage = lp;
        window.electron.ipcRenderer.sendMessage('App:setWinBar', ({
          percentage: calculatedProgress,
          options: { mode: 'normal' }
        }));
        setProgress({
          progressVal: calculatedProgress,
          stepCount: callback.progressing.stepCount,
          currentStep: callback.progressing.stepId,
          subText: callback.task.data?.subDisplay
        });
        break;
      }
      //An error occurred but process execution continue
      case CallbackType.Error: {
        const callback = _callback as unknown as ExitedCallback;
        if (props.onError) props.onError(callback);
        toast.error(<CallbackMessage callback={callback as Callback} />);
        window.electron.ipcRenderer.sendMessage('App:setWinBar', ({
          percentage: progress.progressVal,
          options: { mode: 'error' }
        }));
        //console.log(callback);
        break;
      }
      case CallbackType.Success: {
        if (props.onLaunched) props.onLaunched();
        setDisplayText('Launched');
        setCurrentState(LaunchButtonState.Launched);
        console.log('Game Launched');
        window.electron.ipcRenderer.sendMessage('App:setWinBar', ({ percentage: 0, options: { mode: 'none' } }));
        break;
      }
      //Process Exited (Error, Unable to Launch, or normal Game exit)
      case CallbackType.Exited: {
        const callback = _callback as unknown as ExitedCallback;
        if (props.onExited) props.onExited(callback);
        switch (callback.return.reason) {
          case ExitedReason.Exited: {
            //Game Exited normally
            setDisplayText('Launch');
            setCurrentState(LaunchButtonState.Normal);
            setProgress({
              currentStep: -1, stepCount: 0, progressVal: 0, subText: undefined
            });
            console.log('Game Exited');
            break;
          }
          case ExitedReason.Error: {
            if (props.onError) props.onError(callback);
            setCurrentState(LaunchButtonState.Error);
            setDisplayText((typeof callback.return.display === 'string' ? callback.return.display : callback.return.display?.message) || 'Error');
            toast.error(<CallbackMessage callback={callback as Callback} />, {
              autoClose: false, hideProgressBar: true, style: { width: 'auto' }
            });
            window.electron.ipcRenderer.sendMessage('App:setWinBar', ({
              percentage: progress.progressVal,
              options: { mode: 'error' }
            }));
            break;
          }
          case ExitedReason.Canceled: {
            toast.error(<CallbackMessage callback={callback as Callback} />, {
              autoClose: false, hideProgressBar: true, style: { width: 'auto' }
            });
            setDisplayText('Launch');
            setCurrentState(LaunchButtonState.Normal);
            setProgress({
              currentStep: -1, stepCount: 0, progressVal: 0, subText: undefined
            });
            console.log('Process Exited: ', callback.return.display);
            break;
          }
        }

        break;
      }
      case CallbackType.Preparing: {
        const callback = _callback as unknown as PreloadCallback;
        setCurrentState(LaunchButtonState.Preparing);
        setDisplayText(callback.task.displayText || 'Preparing...');
        break;
      }
      default :
        console.error('Cannot update interface from : ', _callback);
    }
  }

  async function versionSelectorInit(): Promise<JSX.Element> {
    if (props.versionSelector) {
      async function generateList() {
        const versionList: GameVersion[] = await window.electron.ipcRenderer.invoke('Version:getList', {
          gameType: GameType.VANILLA,
          grouped: true
        })
          .catch(async err => {
            const callback: ExitedCallback = {
              type: CallbackType.Error, return: {
                reason: ExitedReason.Error, display: {
                  message: 'Services error',
                  desc: <>
                    <p>Cannot get versions from network </p>
                    <p>(Check <a href={'https://support.xbox.com/fr-FR/xbox-live-status'} target={'_blank'}>Xbox
                      Status</a>)</p>
                  </>,
                  resolution: err.message
                }
              }
            };
            toast.warn(<CallbackMessage callback={callback as Callback} />, { toastId: 'Version:getListError' });
            const localRes = await window.electron.ipcRenderer.invoke('Version:getList', {
              gameType: GameType.VANILLA, type: 'local'
            });
            Select(localRes[0]);
            return localRes;
          });
        setStorage(versionList);
        return versionList;
      }

      const selected = selectedVersion || await getSelected();
      const list = storage || await generateList();

      function handleCallback(version: GameVersion) {
        Select(version);
        window.electron.ipcRenderer.sendMessage('Version:set', { version: version });
      }

      const toolBox = (v: GameVersion) => {
        return {
          select: {
            active: true,
            callback: () => handleCallback(v)
          }
        };
      };
      return (
        <div className={styles.versionSelector}>
          <div className={styles.dataContainer}>
            <Icon className={styles.dropdownIcon} icon={downArrowIcon} alt={'open the dropdown'} onClick={() => {
              setVersionSelector(state === LaunchButtonState.Normal && !isVersionSelectorOpened);
            }} />
            <p className={styles.versionText}>{selected.id.toString()}</p>
          </div>
          {state === LaunchButtonState.Normal &&
            <OutsideAlerter className={styles.versionListDropdown} onClickOutside={() => setVersionSelector(false)}
                            exceptElementClasses={[styles.dropdownIcon]}
            >
              <>
                {list.map((_version: GameVersion | GroupedGameVersions, index: number) => {
                  if ('group' in _version) {
                    const version = _version as GroupedGameVersions;
                    return <CollapsableVersionCard
                      style={{ width: 'fit-content' }} parentVersion={{
                      version: version.parent, toolBox: toolBox(version.parent), settings: { iconType: 'Installed' },
                      className: [styles.version, ((version.parent.id === selected.id) ? styles.versionSelected : '')].join(' ')
                    }} children={version.children.map(childVersion => {
                      return {
                        version: childVersion,
                        toolBox: toolBox(childVersion),
                        settings: { iconType: 'Installed' },
                        style: { margin: '0.5vh 0 0.5vh 0' },
                        className: [styles.version, ((childVersion.id === selected.id) ? styles.versionSelected : '')].join(' ')
                      };
                    })} key={index} />;
                  } else {
                    const version = _version as GameVersion;
                    return (<Popover key={index}
                                     content={'Minecraft ' + version.gameType + ' ' + version.id + (!version.installed ? ' Will be installed' : '')}
                                     placement={'left'}>
                      <VersionCard version={version}
                                   style={{ width: 'fit-content' }}
                                   className={[styles.version, ((version.id === selected.id) ? styles.versionSelected : '')].join(' ')}
                                   settings={{ iconType: 'Installed' }}
                                   toolBox={toolBox(version)}
                      /> </Popover>);
                  }

                })}
              </>
            </OutsideAlerter>}
        </div>);
    } else return <div></div>;

  }

  useEffect(() => setCurrentState(LaunchButtonState.Normal), []);

  return (
    <div
      className={[styles.LaunchButton, (!isOnline ? styles.offlineStyle : undefined), (type === 'square' ? styles.Square : undefined), styles[state]].join(' ')}
      style={props.style}
      data-version-selector={props.versionSelector.toString()}
      data-version-selector-opened={isVersionSelectorOpened}
    >
      <Popover content={state === LaunchButtonState.Launched &&
        <Button type={'primary'} disabled={tryingKill} loading={tryingKill} onClick={() => {
          setTryingKill(true);
          toast.promise(window.electron.ipcRenderer.invoke('GameEngine:KillProcess', { processId: props.id }), {
            pending: 'Killing...',
            error: 'Cannot kill process',
            success: 'Killed process'
          }).then(() => setTryingKill(false));
        }} danger>Force Stop</Button>} placement={'bottom'}>
        <div className={styles.Content}>
          {/*to preserve HTML structure for css selector, the content is reorganized after in css*/}
          <Popover content={state === LaunchButtonState.Preparing ? 'Please wait for Loading...' : undefined}>
            <div className={styles.runContent}
                 onClick={async () => {
                   if (state === LaunchButtonState.Normal || state === LaunchButtonState.Error) {
                     let version = await getSelected();
                     if (version === undefined) {
                       const defaultVersion = getDefaultVersion(getDefaultGameType);
                       window.electron.ipcRenderer.sendMessage('Version:set', { version: defaultVersion });
                       version = defaultVersion;
                     }
                     if (props.onRun) props.onRun(version);
                     requestLaunch(version);
                   } else {
                     return null;
                   }
                 }}>
              <Icon
                className={styles.icon}
                icon={getIcon()}
                alt={'Launch the game Button'}
              />
              {type === 'default' && <p className={styles.text}>{text}</p>}
            </div>
          </Popover>
          {props.versionSelector && <Loader content={versionSelectorInit} className={styles.versionSelectorLoader} />}
          {props.versionSelector && <Divider className={styles.line} type={'vertical'} />}
        </div>
      </Popover>
      {type === 'default' && <div className={styles.LoadingContent}>
          <p>{progress.currentStep + '/' + progress.stepCount}</p>
          <Progress percent={Math.floor(progress.progressVal)} type={'line'} status={'active'}
                    strokeColor={'#39c457'} format={(p) => {
            return (progress.subText === undefined ? ( p + '%') : ('[' + progress.subText + '] '));
          }} />
        </div>}
    </div>
  );
}


