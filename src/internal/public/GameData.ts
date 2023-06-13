/*CAN BE LOADED FROM RENDERER PROCESS
 * DONT IMPORT FS, PATH, ELECTRON, etc...*/

import { CallbackType, knowGameErrorFormat } from './ErrorDecoder';
import { ResolvedPreLaunchTask } from '../PreLaunchEngine';

export enum GameType {
  VANILLA = 'VANILLA'
}

export type VersionData = {
  id: string;
  gameType: GameType;
  installed?: boolean;
};

export const getDefaultGameType: GameType = GameType.VANILLA;
export const getDefaultVersion = (gameType: GameType) => {
  return supportedVersion[
    supportedVersion.findIndex((v) => v.gameType == gameType)
    ];
};
export const supportedVersion: Array<VersionData> = [
  { id: '1.20', gameType: GameType.VANILLA },
  { id: '1.19.4', gameType: GameType.VANILLA },
  { id: '1.18.2', gameType: GameType.VANILLA },
  { id: '1.16.5', gameType: GameType.VANILLA },
  { id: '1.14.4', gameType: GameType.VANILLA },
  { id: '1.13.2', gameType: GameType.VANILLA },
  { id: '1.12.2', gameType: GameType.VANILLA },
  { id: '1.18.9', gameType: GameType.VANILLA },
  { id: '1.7.10', gameType: GameType.VANILLA }
];

export enum LaunchOperationType {
  //Check some information before Launch, like: Server state etc...
  Preload = 'Preload',
  //Test and diagnose files, (type like "install if not exist")
  Parse = 'Parse',
  //Verify: installed files, configuration, etc (like Parse but return error if not installed)
  Verify = 'Verify',
  //Install Files not locally present.
  Install = 'Install',
  //Execute some file, setup Program, etc...
  Setup = 'Setup',
  //Install some special configurations file, like in: .config folder...
  PostInstall = 'PostInstall'
}

export type ResolvedLaunchOperation = ResolvedPreLaunchTask

export enum PreLaunchTasks {
  VerifyAccount = 'VerifyAccount',
  ParseJava = 'ParseJava',
  ParseGameFile = 'ParseGameFile',
  VerifyGameFile = 'VerifyGameFile',
  InstallBootstrap = 'InstallBootstrap',
  Launch = "Launch"
};

export type LaunchTask = {
  id: keyof typeof PreLaunchTasks,
  params?: any
}

export function sendUnImplementedException(task: LaunchTask): UpdateLaunchTaskCallback {
  return { task: task, displayText: 'Function ' + task.id + ' is not implemented', state: LaunchTaskState.error };
}


export const isSupported = (gameType: GameType, id: string): boolean => {
  for (const version of supportedVersion) {
    if (version.id === id && version.gameType === gameType) {
      return true;
    }
  }
  return false;
};
export const getVersion = (gameType: GameType, id: string): VersionData => {
  if (isSupported(gameType, id)) {
    for (const version of supportedVersion) {
      if (version.id === id && version.gameType === gameType) return version;
    }
    throw new Error(
      'Cannot get minecraft version: ' + id + ' in GameType: ' + gameType + '.'
    );
  } else {
    throw new Error(
      'Version ' + id + 'isn\'t unsupported, \n maybe is the wrong gameType'
    );
  }
};

export interface Callback {
  stepId: number,
  stepCount: number
  return: any,
  type: CallbackType,
}

export interface ErrorCallback extends Callback {
  type: CallbackType.Error,
  return: knowGameErrorFormat | string
}

export interface ProgressCallback extends Callback {
  type: CallbackType.Progress,
  task: UpdateLaunchTaskCallback
}

export interface LaunchedCallback extends Callback {
  type: CallbackType.Success,
}

export interface ExitedCallback extends Callback {
  type: CallbackType.Closed;
}

export interface StartedCallback extends Callback {
  type: CallbackType.Success;
}

export enum LaunchTaskState {
  starting,
  processing,
  finished,
  error
}

export interface UpdateLaunchTaskCallback {
  task: LaunchTask,
  state: LaunchTaskState,
  displayText?: string,
  data?: {
    return?: any
    localProgress?: number
  }
}

export interface ProgressLaunchCallback {
  displayText?: string,
  return?: any,
  localProgress?: number
  state: LaunchTaskState
}

export interface PreLaunchProcess {
  actions: LaunchTask[];
  resolved: false;
  internal: false;
  version: VersionData;
  launch: boolean;
}

export interface PreLaunchRunnableProcess {
  actions: ResolvedLaunchOperation[];
  resolved: true;
  internal?: boolean;
  version: VersionData;
  launch: boolean;
}
