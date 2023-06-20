import styles from './css/LaunchButton.module.css';
import Icon from '../public/Icons/Icon';
import LaunchIcon from '../../../assets/graphics/icons/caret-right.svg';
import LoadingIcon from '../../../assets/graphics/icons/loading.svg';
import ErrorIcon from '../../../assets/graphics/icons/close.svg';
import downArrowIcon from '../../../assets/graphics/icons/arrow_down.svg';
import Line from '../public/Line';
import React, { useContext, useState } from 'react';
import {
  Callback,
  ErrorCallback,
  ExitedCallback,
  GameType,
  getDefaultGameType,
  getDefaultVersion,
  LaunchedCallback,
  LaunchTaskState,
  PreLaunchProcess,
  PreLaunchTasks,
  ProgressCallback,
  VersionData
} from '../../../internal/public/GameData';
import Loader from '../public/Loader';
import { globalStateContext } from '../../index';
import { toast } from 'react-toastify';
import CallbackMessage from '../public/CallbackMessage';
import ProgressBar from '@ramonak/react-progress-bar';
import { CallbackType } from '../../../internal/public/ErrorDecoder';
import Version from '../public/Version';
import { ComponentsPublic } from '../ComponentsPublic';

async function getSelected() {
  return await window.electron.ipcRenderer.invoke('Version:get', {});
}

export enum LaunchButtonState {
  Normal = 'Normal',
  Loading = 'Loading',
  Error = 'Error',
  Launched = 'Launched'
}

function isOnline(): boolean {
  return useContext(globalStateContext).isOnline;
}

export type LoadingProgress = {
  currentStep: number,
  stepCount: number,
  progressVal: number
}

export interface LaunchButtonProps extends ComponentsPublic {
  versionSelector: boolean,
  type?: 'square' | 'default',
  onRun?: (version: VersionData) => any,
  onProgressCallback?: (callback: ProgressCallback) => any,
  onError?: (err: ErrorCallback | any) => any
  onExited?: (exitedCallback: ExitedCallback) => any
  onLaunched?: () => any
}

export default function LaunchButton({
                                       style,
                                       versionSelector,
                                       type,
                                       onRun,
                                       onExited,
                                       onProgressCallback,
                                       onLaunched,
                                       onError
                                     }: LaunchButtonProps) {
  type = type === undefined ? 'default' : type;
  const [isVersionSelectorOpened, setVersionSelector] = useState(false);
  const [state, setCurrentState] = useState(LaunchButtonState.Normal);
  const [text, setDisplayText] = useState('Launch');
  const [progress, setProgress] = useState<LoadingProgress>({
    currentStep: -1,
    stepCount: 0,
    progressVal: 0
  });
  let localStepPercentage: number = 0;
  const getIcon = () => {
    switch (state) {
      case LaunchButtonState.Error:
        return ErrorIcon;
      case LaunchButtonState.Normal:
      case LaunchButtonState.Launched:
        return LaunchIcon;
      case LaunchButtonState.Loading:
        return LoadingIcon;
    }
  };
  const requestLaunch = (version: VersionData) => {
    const process: PreLaunchProcess = {
      actions: [
        { id: PreLaunchTasks.VerifyAccount },
        { id: PreLaunchTasks.ParseJava },
        { id: PreLaunchTasks.ParseGameFile, params: { version: version } }
      ], launch: true,
      version: version,
      internal: false,
      resolved: false
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
  };


  function decodeLaunchCallback(_callback: Callback | ProgressCallback | ErrorCallback | LaunchedCallback | ExitedCallback) {
    switch (_callback.type) {
      case CallbackType.Progress: {
        const callback: ProgressCallback = _callback as unknown as ProgressCallback;
        if (onProgressCallback) onProgressCallback(callback);
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
        if (containLP) localStepPercentage = lp;
        setProgress({
          progressVal: calculatedProgress,
          stepCount: callback.stepCount,
          currentStep: callback.stepId
        });
        //console.log(callback.stepId + ' + ' + lp + ' | ' + localStepPercentage + '  : ' + calculatedProgress + '\n', callback);
        break;
      }
      case CallbackType.Error: {
        const callback = _callback as unknown as ErrorCallback;
        if (onError) onError(callback);
        setCurrentState(LaunchButtonState.Error);
        setDisplayText('Error');
        toast.error(<CallbackMessage callback={callback} />, {
          autoClose: false,
          hideProgressBar: true,
          style: { width: 'auto' }
        });
        //console.log(callback);
        break;
      }
      case CallbackType.Success: {
        if(onLaunched) onLaunched()
        setDisplayText('Launched');
        setCurrentState(LaunchButtonState.Launched);
        console.log('Game Launched');
        break;
      }
      case CallbackType.Closed: {
        const callback = _callback as unknown as ExitedCallback
        if(onExited) onExited(callback)
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

  const versionSelectorInit = async (reload: () => void): Promise<JSX.Element> => {
    if (versionSelector) {
      let selectedVersion = await getSelected();
      const versionList = await window.electron.ipcRenderer.invoke('Version:getList', { gameType: GameType.VANILLA })
        .catch(async err => {
          const callback: ErrorCallback = {
            stepId: -1,
            stepCount: -1,
            type: CallbackType.Error,
            return: {
              message: 'Error occurred',
              desc: 'Cannot get versions from network',
              resolution: err.message
            }
          };
          toast.error(<CallbackMessage callback={callback} />, { toastId: 'Version:getListError' });
          const localRes = await window.electron.ipcRenderer.invoke('Version:getList', {
            gameType: GameType.VANILLA,
            type: 'local'
          });
          selectedVersion = localRes[0];
          return localRes;
        });
      Object.freeze(selectedVersion);
      return (
        <div className={styles.versionSelector} onClick={() => {
          setVersionSelector(state === LaunchButtonState.Normal && !isVersionSelectorOpened);
        }}>
          <div className={styles.dataContainer}>
            <Icon className={styles.dropdownIcon} icon={downArrowIcon} alt={'open the dropdown'} />
            <p className={styles.versionText}>{selectedVersion.id.toString()}</p>
          </div>
          <div className={styles.versionListDropdown}>

            {versionList.map((version: VersionData, index: any) => {
              return <Version version={{ id: version.id, gameType: GameType.VANILLA }}
                              key={index}
                              className={[styles.version, version.id === selectedVersion.id ? styles.versionSelected : ''].join(' ')}
                              isInstalled={version.installed} selected={version.id === selectedVersion.id}
                              tools={false}
                              canSelect={true}
              />;

            })
            }

          </div>
        </div>
      );
    } else return <div></div>;

  };
  return (

    <div
      className={[styles.LaunchButton, (!isOnline() ? styles.offlineStyle : undefined), (type === 'square' ? styles.Square : undefined), styles[state]]
        .join(' ')}
      style={style}
      data-version-selector={versionSelector.toString()}
      data-version-selector-opened={isVersionSelectorOpened}
    >
      <div className={styles.Content}>
        {/*to preserve HTML structure for css selector, the content is reorganized in css*/}
        <div className={styles.runContent}
             onClick={async () => {
               if (state === LaunchButtonState.Normal) {
                 let version = await getSelected();
                 if (version === undefined) {
                   const defaultVersion = getDefaultVersion(getDefaultGameType);
                   window.electron.ipcRenderer.sendMessage('Version:set', defaultVersion);
                   version = defaultVersion;
                 }
                 if (onRun) onRun(version);
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
        {versionSelector && <Loader
          content={versionSelectorInit}
          className={styles.versionSelectorLoader} style={undefined} />}

        {versionSelector ? (
          <Line className={styles.line} direction={'vertical'} customStyle={undefined} />
        ) : null}
      </div>
      {type === 'default' && <div className={styles.LoadingContent}>
        <p>{progress.currentStep + '/' + progress.stepCount}</p>
        <ProgressBar completed={Math.ceil(progress.progressVal)}
                     maxCompleted={100}
                     className={styles.ProgressBar}
                     bgColor={'#39c457'}
                     baseBgColor={'#4b4949'}
                     labelColor={'#fff'}
        />
      </div>}
    </div>
  );
}


