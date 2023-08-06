import { knowErrorFormat } from './ErrorPublic';
import { ChildProcess } from 'child_process';
import { ResolvedLaunchTask } from '../main/internal/PreLaunchEngine';

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
export enum LaunchOperationClass {
  //Private internal functions
  Private,
  //Preload: Assign some variables before the launch
  Preload,
  //Verify: Check some value before the launch (can cancel process)
  Verify,
  //Test and diagnose files, (like "install if not exist")
  Parse,
  //Install Files not locally present.
  Install,
  //Execute some file, setup Program, etc...
  Setup,
  //Install some special configurations file, like in: "config" folder...
  PostInstall
}

export type RawLaunchTask = { key: string, type: LaunchOperationClass, params?: { [key: string]: any } }
/**
 * @link Documentation https://docs.google.com/document/d/1qbFN9mUhHqPQ5Pp8L_7p3sf6C6kwzn6ldTO5pg2u3Hw/edit#heading=h.xqpjlolg2avj
 */
export const RawLaunchOperationList: RawLaunchTask[] = [
  { key: 'InstallExternal', type: LaunchOperationClass.Install },
  { key: 'ParseBootstrap', type: LaunchOperationClass.Parse },
  { key: 'ParseMods', type: LaunchOperationClass.Parse },
  { key: 'ParseOptifine', type: LaunchOperationClass.Parse },
  { key: 'ParseResources', type: LaunchOperationClass.Parse },
  { key: 'GetPreloadData', type: LaunchOperationClass.Preload },
  { key: 'ParseAccount', type: LaunchOperationClass.Private },
  { key: 'ParseGameFile', type: LaunchOperationClass.Parse },
  { key: 'ParseJava', type: LaunchOperationClass.Parse },
  { key: 'Launch', type: LaunchOperationClass.Parse },
  { key: 'CheckServer', type: LaunchOperationClass.Verify },
  { key: 'CheckCondition', type: LaunchOperationClass.Verify },
  { key: 'RunFile', type: LaunchOperationClass.Setup },
  { key: 'SetConfig', type: LaunchOperationClass.PostInstall }
];

export const LaunchOperationKit: { [f: string]: RawLaunchTask } = {
  InstallExternal: { key: 'InstallExternal', type: LaunchOperationClass.Install },
  ParseBootstrap: { key: 'ParseBootstrap', type: LaunchOperationClass.Parse },
  ParseMods: { key: 'ParseMods', type: LaunchOperationClass.Parse },
  ParseOptifine: { key: 'ParseOptifine', type: LaunchOperationClass.Parse },
  ParseResources: { key: 'ParseResources', type: LaunchOperationClass.Parse },
  GetPreloadData: { key: 'GetPreloadData', type: LaunchOperationClass.Preload },
  ParseAccount: { key: 'ParseAccount', type: LaunchOperationClass.Private },
  ParseGameFile: { key: 'ParseGameFile', type: LaunchOperationClass.Parse },
  ParseJava: { key: 'ParseJava', type: LaunchOperationClass.Parse },
  Launch: { key: 'Launch', type: LaunchOperationClass.Parse },
  CheckServer: { key: 'CheckServer', type: LaunchOperationClass.Verify },
  CheckCondition: { key: 'CheckCondition', type: LaunchOperationClass.Verify },
  RunFile: { key: 'RunFile', type: LaunchOperationClass.Setup },
  SetConfig: { key: 'SetConfig', type: LaunchOperationClass.PostInstall }
};

/*************/
export enum CallbackType {
  Error = 'Error',
  Progress = 'Progress',
  Success = 'Success',
  Closed = 'Closed',
}

export interface Callback {
  stepId: number,
  stepCount: number
  return?: any,
  type: CallbackType,
}

export interface ErrorCallback extends Callback {
  type: CallbackType.Error,
  return: knowErrorFormat | string
}

export interface ProgressCallback extends Callback {
  type: CallbackType.Progress,
  task: SubLaunchTaskCallback
}

export interface ExitedCallback {
  type: CallbackType.Closed;
  return?: any;
}

export enum LaunchTaskState {
  starting,
  processing,
  finished,
  error
}

export interface SubLaunchTaskCallback {
  task?: RawLaunchTask,
  state: LaunchTaskState,
  displayText?: string,
  data?: {
    return?: any
    localProgress?: number
  }
}

export interface FinishedSubTaskCallback extends SubLaunchTaskCallback {
  state: LaunchTaskState.finished | LaunchTaskState.error;
  response: PreLaunchResponse;
}

/**
 * @link Documentation https://docs.google.com/document/d/1qbFN9mUhHqPQ5Pp8L_7p3sf6C6kwzn6ldTO5pg2u3Hw/edit#heading=h.36qbnosish4f
 */
export interface RawLaunchProcess {
  version: GameVersion,
  process: RawLaunchTask[],
  allowCustomOperations?: boolean,
  manual?: boolean,
  internal?: boolean,
  id: string
}

export interface LaunchProcess {
  version: GameVersion,
  process: ResolvedLaunchTask[],
  allowCustomOperations?: boolean,
  manual?: boolean,
  internal?: boolean,
  id: string
}


export interface PreLaunchResponse {
  success: boolean;
  data?: any;
  error?: any;
}

/*************/

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
