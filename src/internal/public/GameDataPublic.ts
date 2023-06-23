import { knowErrorFormat } from './ErrorPublic';
import { ResolvedPreLaunchTask } from '../PreLaunchEngine';

export enum GameType {
  VANILLA = 'VANILLA'
}

export type GameVersion = {
  id: string;
  gameType: GameType;
  installed?: boolean;
};
export const getDefaultGameType: GameType = GameType.VANILLA;
export const getDefaultVersion = (gameType: GameType) => {
  return supportedVersion[
    supportedVersion.findIndex((v) => v.gameType === gameType)
    ];
};
export const supportedVersion: Array<GameVersion> = [
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


export enum PreLaunchTasks {
  VerifyAccount = 'VerifyAccount',
  ParseJava = 'ParseJava',
  ParseGameFile = 'ParseGameFile',
  VerifyGameFile = 'VerifyGameFile',
  InstallBootstrap = 'InstallBootstrap',
  Launch = 'Launch'
}

export type LaunchTask = {
  id: keyof typeof PreLaunchTasks,
  params?: any
}

export const isSupported = (gameType: GameType, id: string): boolean => {
  for (const version of supportedVersion) {
    if (version.id === id && version.gameType === gameType) {
      return true;
    }
  }
  return false;
};

export function getVersion(gameType: GameType, id: string): GameVersion {
  if (!isSupported(gameType, id)) throw new Error(`Version ${id}, isn't unsupported, maybe is the wrong gameType`);
  for (const version of supportedVersion) {
    if (version.id === id && version.gameType === gameType) return version;
  }
  throw new Error(`Cannot get minecraft version: ${id} in GameType: ${gameType}.`);
}

export enum CallbackType {
  Error = 'Error',
  Progress = 'Progress',
  Success = 'Success',
  Closed = 'Closed',
}

export interface Callback {
  stepId: number,
  stepCount: number
  return: any,
  type: CallbackType,
}

export interface ErrorCallback extends Callback {
  type: CallbackType.Error,
  return: knowErrorFormat | string
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

export interface ProgressSubTaskCallback {
  displayText?: string,
  return?: any,
  localProgress?: number
  state: LaunchTaskState
}

export interface PreLaunchProcess {
  actions: LaunchTask[];
  resolved: false;
  internal: false;
  version: GameVersion;
  launch: boolean;
}

export interface PreLaunchRunnableProcess {
  actions: ResolvedPreLaunchTask[];
  resolved: true;
  internal?: boolean;
  version: GameVersion;
  launch: boolean;
}
