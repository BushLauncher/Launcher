import { knowErrorFormat } from './ErrorPublic';
import { ResolvedPreLaunchTask } from '../main/internal/PreLaunchEngine';
import { ChildProcess } from 'child_process';

export enum GameType {
  VANILLA = 'VANILLA'
}

export type GameVersion = {
  id: string;
  gameType: GameType;
  installed?: boolean;
};
export const getDefaultGameType: GameType = GameType.VANILLA;
export const getDefaultVersion = (gameType: GameType): GameVersion => {
  switch (gameType) {
    case GameType.VANILLA:
      return { id: ' 1.20', gameType: gameType };
    default:
      throw new Error('GameType: ' + gameType + ' is not implemented');
  }
};

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
  ParseAccount = 'ParseAccount',
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

export interface FinishedSubTaskCallback extends UpdateLaunchTaskCallback {
  state: LaunchTaskState.finished | LaunchTaskState.error;
  response: PreLaunchResponse;
}

export interface PreLaunchProcess {
  id: string,
  actions: LaunchTask[];
  resolved: false;
  internal: false;
  version: GameVersion;
  launch: boolean;
}

export interface PreLaunchRunnableProcess {
  id: string,
  actions: ResolvedPreLaunchTask[];
  resolved: true;
  internal?: boolean;
  version: GameVersion;
  launch: boolean;
}


export interface PreLaunchResponse {
  success: boolean;
  data: any;
}

export interface PreLaunchError extends PreLaunchResponse {
  error: any;
  success: false;
}

export enum RunningVersionState {
  Launching,
  Running
}

export interface RunningVersion {
  id: string,
  Version: GameVersion,
  State: RunningVersionState,
  process?: ChildProcess
}
