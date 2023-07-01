import styles from './css/LaunchButton.module.css';
import Icon from '../public/Icons/Icon';
import LaunchIcon from '../../../assets/graphics/icons/caret-right.svg';
import LoadingIcon from '../../../assets/graphics/icons/loading.svg';
import ErrorIcon from '../../../assets/graphics/icons/close.svg';
import downArrowIcon from '../../../assets/graphics/icons/arrow_down.svg';
import React, { useState } from 'react';
import {
  Callback,
  CallbackType,
  ErrorCallback,
  ExitedCallback,
  GameType,
  GameVersion,
  getDefaultGameType,
  getDefaultVersion,
  LaunchedCallback,
  LaunchTaskState,
  PreLaunchProcess,
  PreLaunchTasks,
  ProgressCallback
} from '../../../public/GameDataPublic';
import Loader from '../public/Loader';
import { globalStateContext } from '../../index';
import { toast } from 'react-toastify';
import CallbackMessage from '../public/CallbackMessage';
import ProgressBar from '@ramonak/react-progress-bar';
import { ComponentsPublic } from '../ComponentsPublic';
import { Divider, Popover, Progress } from 'antd';
import VersionCard from '../public/VersionCard';


export enum LaunchButtonState {
  Normal = 'Normal', Loading = 'Loading', Error = 'Error', Launched = 'Launched'
}


export type LoadingProgress = {
  currentStep: number, stepCount: number, progressVal: number
}

export interface LaunchButtonProps extends ComponentsPublic {
  versionSelector: boolean,
  type?: 'square' | 'default',
  onRun?: (version: GameVersion) => any,
  onProgressCallback?: (callback: ProgressCallback) => any,
  onError?: (err: ErrorCallback | any) => any
  onExited?: (exitedCallback: ExitedCallback) => any
  onLaunched?: () => any
}

export default function LaunchButton(props: LaunchButtonProps) {
  const type = (props.type === undefined) ? 'default' : props.type;
  const { isOnline } = React.useContext(globalStateContext);

  const [isVersionSelectorOpened, setVersionSelector] = useState(false);
  const [state, setCurrentState] = useState(LaunchButtonState.Normal);
  const [text, setDisplayText] = useState('Launch');
  const [progress, setProgress] = useState<LoadingProgress>({ currentStep: -1, stepCount: 0, progressVal: 0 });
  let localStepPercentage: number = 0;

  async function getSelected() {
    return await window.electron.ipcRenderer.invoke('Version:get', {});
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
    const process: PreLaunchProcess = {
      actions: [{ id: PreLaunchTasks.VerifyAccount }, { id: PreLaunchTasks.ParseJava }, {
        id: PreLaunchTasks.ParseGameFile,
        params: { version: version }
      }], launch: true, version: version, internal: false, resolved: false
    };
    setVersionSelector(false);
    setDisplayText('Initializing...');
    console.log('Requesting Launch...');
    //@ts-ignore
    window.electron.ipcRenderer.on('GameLaunchCallback', (callback: Callback) => {
      decodeLaunchCallback(callback);
    });
    window.electron.ipcRenderer.invoke('GameEngine:Launch', { LaunchProcess: process })
      .then((exitedCallback: ExitedCallback) => {
        decodeLaunchCallback(exitedCallback);
      });
  }


  function decodeLaunchCallback(_callback: Callback | ProgressCallback | ErrorCallback | LaunchedCallback | ExitedCallback) {
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
        let calculatedProgress: number = (100 * (callback.stepId + 1));
        calculatedProgress += (lp - 100);
        calculatedProgress /= (callback.stepCount + 1);
        /*console.log(`((100 * ${callback.stepId}) - ${lp})/ ${callback.stepCount}
    = (${100 * callback.stepId} - ${lp})/ ${callback.stepCount})
    = (${(100 * callback.stepId) - lp})/ ${callback.stepCount})
    = ${calculatedProgress}`);*/
        //console.log(callback.stepId + ' + ' + lp + ' | ' + localStepPercentage + '  : ' + calculatedProgress + '\n', callback);
        if (containLP) localStepPercentage = lp;
        setProgress({
          progressVal: calculatedProgress, stepCount: callback.stepCount, currentStep: callback.stepId
        });
        break;
      }
      case CallbackType.Error: {
        const callback = _callback as unknown as ErrorCallback;
        if (props.onError) props.onError(callback);
        setCurrentState(LaunchButtonState.Error);
        setDisplayText('Error');
        toast.error(<CallbackMessage callback={callback} />, {
          autoClose: false, hideProgressBar: true, style: { width: 'auto' }
        });
        //console.log(callback);
        break;
      }
      case CallbackType.Success: {
        if (props.onLaunched) props.onLaunched();
        setDisplayText('Launched');
        setCurrentState(LaunchButtonState.Launched);
        console.log('Game Launched');
        break;
      }
      case CallbackType.Closed: {
        const callback = _callback as unknown as ExitedCallback;
        if (props.onExited) props.onExited(callback);
        setDisplayText('Launch');
        setCurrentState(LaunchButtonState.Normal);
        setProgress({
          currentStep: -1, stepCount: 0, progressVal: 0
        });
        console.log('Game Exited');
        break;
      }
      default :
        console.error('Cannot update interface from : ', _callback);
    }
  }

  async function versionSelectorInit(): Promise<JSX.Element> {
    if (props.versionSelector) {
      let selectedVersion = await getSelected();
      const versionList = await window.electron.ipcRenderer.invoke('Version:getList', { gameType: GameType.VANILLA })
        .catch(async err => {
          const callback: ErrorCallback = {
            stepId: -1, stepCount: -1, type: CallbackType.Error, return: {
              message: 'Error occurred', desc: 'Cannot get versions from network', resolution: err.message
            }
          };
          toast.error(<CallbackMessage callback={callback} />, { toastId: 'Version:getListError' });
          const localRes = await window.electron.ipcRenderer.invoke('Version:getList', {
            gameType: GameType.VANILLA, type: 'local'
          });
          selectedVersion = localRes[0];
          return localRes;
        });
      Object.freeze(selectedVersion);
      return (<div className={styles.versionSelector} onClick={() => {
        setVersionSelector(state === LaunchButtonState.Normal && !isVersionSelectorOpened);
      }}>
        <div className={styles.dataContainer}>
          <Icon className={styles.dropdownIcon} icon={downArrowIcon} alt={'open the dropdown'} />
          <p className={styles.versionText}>{selectedVersion.id.toString()}</p>
        </div>
        <div className={styles.versionListDropdown}>

          {versionList.map((version: GameVersion, index: number) => {
            return <Popover key={index}
                            content={'Minecraft ' + version.gameType + ' ' + version.id + (!version.installed ? ' Will be installed' : '')} placement={'left'}>
              <VersionCard version={version}

                           className={[styles.version, ((version.id === selectedVersion.id) ? styles.versionSelected : '')].join(' ')}
                           settings={{ iconType: 'Installed' }}
                           toolBox={{
                             select: {
                               active: true,
                               callback: () => window.electron.ipcRenderer.sendMessage('Version:set', { version: version })
                             }
                           }}
              /> </Popover>;

          })}

        </div>
      </div>);
    } else return <div></div>;

  }

  return (

    <div
      className={[styles.LaunchButton, (!isOnline ? styles.offlineStyle : undefined), (type === 'square' ? styles.Square : undefined), styles[state]].join(' ')}
      style={props.style}
      data-version-selector={props.versionSelector.toString()}
      data-version-selector-opened={isVersionSelectorOpened}
    >
      <div className={styles.Content}>
        {/*to preserve HTML structure for css selector, the content is reorganized after in css*/}
        <div className={styles.runContent}
             onClick={async () => {
               if (state === LaunchButtonState.Normal) {
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
        {props.versionSelector &&
          <Loader content={versionSelectorInit} className={styles.versionSelectorLoader} style={undefined} />}

        {props.versionSelector && <Divider className={styles.line} type={'vertical'} />}
      </div>
      {type === 'default' && <div className={styles.LoadingContent}>
        <p>{progress.currentStep + '/' + progress.stepCount}</p>
        <Progress percent={Math.floor(progress.progressVal)} type={'line'} status={'active'} strokeColor={"#39c457"} />
      </div>}
    </div>);
}


