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

/**
 * @link Documentation https://docs.google.com/document/d/1qbFN9mUhHqPQ5Pp8L_7p3sf6C6kwzn6ldTO5pg2u3Hw/edit#heading=h.n7l628o45j4j
 */
export enum LaunchOperationType {
  //Preload: Assign some variables before the launch
  Preload = 'Preload',
  //Verify: Check some value before the launch (can cancel process)
  Verify = 'Verify',
  //Test and diagnose files, (like "install if not exist")
  Parse = 'Parse',
  //Install Files not locally present.
  Install = 'Install',
  //Execute some file, setup Program, etc...
  Setup = 'Setup',
  //Install some special configurations file, like in: "config" folder...
  PostInstall = 'PostInstall'
}

/**
 * @link Documentation https://docs.google.com/document/d/1qbFN9mUhHqPQ5Pp8L_7p3sf6C6kwzn6ldTO5pg2u3Hw/edit#heading=h.xqpjlolg2avj
 */
export enum LaunchOperation {
  InstallExternal = 'InstallExternal',
  //
  ParseBootstrap = 'ParseBootstrap',
  ParseMods = 'ParseMods',
  ParseOptifine = 'ParseOptifine',
  ParseResources = 'ParseResources',
  //
  GetPreloadData = 'GetPreloadData',
  //
  ParseAccount = 'ParseAccount',
  ParseGameFile = 'ParseGameFile',
  ParseJava = 'ParseJava',
  ResolveProcess = 'ResolveProcess',
  //
  CheckServer = 'CheckServer',
  CheckCondition = 'CheckCondition',
  //
  RunFile = 'RunFile',
  //
  SetConfig = 'SetConfig',
}

export type LaunchTask = {
  task: keyof typeof LaunchOperation,
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

export interface LaunchProcess {
  version: GameVersion,
  type: GameType,
  process: LaunchTask[]
  allowCustomOperations: boolean,
  manual: boolean,
  internal: boolean,
}

/**
 * @deprecated
 */
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
