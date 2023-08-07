import {
  Callback,
  CallbackType,
  ExitedCallback,
  ExitedReason,
  GameVersion,
  LaunchOperationClass,
  LaunchOperationKit,
  LaunchProcess,
  LaunchTaskState,
  PreLaunchResponse,
  ProgressCallback,
  RawLaunchProcess,
  RawLaunchTask,
  RunningVersion,
  RunningVersionState,
  SubLaunchTaskCallback,
  PreloadCallback
} from '../../public/GameDataPublic';
import { AnalyseLaunchProcess, ResolvedLaunchTask } from './PreLaunchEngine';
import { createMinecraftProcessWatcher, launch } from '@xmcl/core';
import { ChildProcess } from 'child_process';
import { getSelectedAccount, isAccountValid } from './AuthModule';
import getAppDataPath from 'appdata-path';
import { currentWindow, userDataStorage } from '../main';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';

const console = new ConsoleManager('Launcher', ProcessType.Internal);


export const RunningVersionList: RunningVersion[] = [];

export function SetRunningVersionState(runningVersionId: number, newState: RunningVersionState) {
  if (RunningVersionList[runningVersionId] !== undefined) {
    RunningVersionList[runningVersionId].State = newState;
    currentWindow?.webContents.send('UpdateMainTabsState');
  } else console.raw.error('Running version ' + runningVersionId + ' doesn\'t exist');
}

export function RegisterRunningVersion(process: LaunchProcess | RawLaunchProcess): number {
  //Verify if RV with same key doesn't already exist
  const index = RunningVersionList.findIndex(rv => rv.id === process.id);
  if (index === -1) {
    RunningVersionList.push({
      id: process.id,
      Version: process.version,
      State: RunningVersionState.Launching
    });
    currentWindow?.webContents.send('UpdateMainTabsState');
    // -1 to get the id of last element
    return RunningVersionList.length - 1;
  } else {
    console.raw.error('Version ' + process.id + ' already registered !');
    return -1;
  }
}

export function UnregisterRunningVersion(id: string): boolean {
  const index = RunningVersionList.findIndex(rv => rv.id === id);
  if (index !== -1) {
    RunningVersionList.splice(index);
    currentWindow?.webContents.send('UpdateMainTabsState');
    return true;
  } else {
    console.raw.error('Cannot find ' + id + ' running version');
    return false;
  }
}

export function Launch(process: RawLaunchProcess, Callback: (callback: Callback) => void, runningVersionIndex?: number) {
  console.log('Launching [' + process.id + ']');
  //Register version as Running (Did before in Main!)
  if (runningVersionIndex === undefined) runningVersionIndex = RegisterRunningVersion(process);
  return RunLaunchProcess(runningVersionIndex, process, (callback: Callback) => Callback(callback));
}

export async function RunLaunchProcess(id: number, rawProcess: RawLaunchProcess, Callback: (callback: Callback) => void): Promise<ExitedCallback> {
  return new Promise<ExitedCallback>(async (resolve) => {
    //**Preload**
    const process: LaunchProcess = await AnalyseLaunchProcess(rawProcess);
    //Security check
    if (process.allowCustomOperations) {
      const res: boolean = await getAutorisation();
      if (!res) {
        console.warn('Process execution Canceled (unauthorized)');
        resolve(<ExitedCallback>{
          type: CallbackType.Exited,
          return: { reason: ExitedReason.UnableToLaunch, display: 'Unauthorized to launch' }
        });
        return;
      } else console.raw.error('** Process running in insecure mode ! **');
    }
    //Parse process
    const preload_stepsCount = process.preloadProcess.length;

    const LaunchStorage: { task: RawLaunchTask, response: PreLaunchResponse }[] = [];
    /******************/

    Callback(<PreloadCallback>{
      type: CallbackType.Preparing,
      task: { state: LaunchTaskState.starting, displayText: 'Checking integrity...' }
    });
    const CreateVerifyCallback = (subTask: SubLaunchTaskCallback, index: number) => {
      if (subTask.state === LaunchTaskState.error) {
        Callback({
          progressing: { stepId: index, stepCount: preload_stepsCount },
          type: CallbackType.Error,
          return: { reason: ExitedReason.Error, display: subTask.data?.return }
        });
      } else {
        Callback(<Callback>{
          progressing: { stepId: index, stepCount: preload_stepsCount },
          task: subTask,
          type: CallbackType.Preparing
        });
      }
    };
    //Execute Preload functions
    if (preload_stepsCount > 0) {
      console.log('Verifying ' + preload_stepsCount + ' tasks...');
      for (const task of process.preloadProcess) {
        const i = process.preloadProcess.indexOf(task);
        try {
          console.warn('Verify: Executing task ' + i + '/' + (preload_stepsCount - 1) + ' : ' + task.baseTask.key + '...');
          const response = await task.run((c) => CreateVerifyCallback(c, i));
          //Check for condition stop
          if (response.task?.params?.stopOnFalse === true) {
            if (response.task?.type === LaunchOperationClass.Verify && response.response.data.result === false) {
              console.error(response.displayText || 'Some requirements cannot be fulfilled', '\n STOPPING');
              resolve(<ExitedCallback>{
                type: CallbackType.Exited,
                return: {
                  reason: ExitedReason.UnableToLaunch,
                  display: response.displayText || 'Some requirements cannot be fulfilled \n(please retry later)'
                }
              });
              return;
            }
          }
          if (response.state === LaunchTaskState.error) {
            SetRunningVersionState(id, RunningVersionState.Error);
            resolve(<ExitedCallback>{
              progressing: {
                stepId: i,
                stepCount: preload_stepsCount
              },
              type: CallbackType.Error,
              return: { reason: ExitedReason.Error, display: response.data || response.response.error }
            });
            return;
          } else {
            LaunchStorage.push({
              task: task.baseTask, response: response.response
            });
          }
        } catch (err: any) {
          resolve(<ExitedCallback>{
            progressing: {
              stepId: i,
              stepCount: preload_stepsCount
            },
            type: CallbackType.Error,
            return: { reason: ExitedReason.Error, display: err }
          });
          return;
        }
      }
      console.warn('Passed all verify ! Launching...');
    } else console.log('No verifications to run');
    /******************/
    //Execute process
    //ONLY non-preload function are registered
    const process_stepsCount = parseProcess(process.process);
    const CreateProcessCallback = (subTask: SubLaunchTaskCallback, index: number) => {
      if (subTask.state === LaunchTaskState.error) {
        Callback({
          progressing: { stepId: index, stepCount: process_stepsCount },
          type: CallbackType.Error,
          return: { reason: ExitedReason.Error, display: subTask.data?.return }
        });
      } else {
        Callback(<ProgressCallback>{
          progressing: { stepId: index, stepCount: process_stepsCount },
          task: subTask,
          type: CallbackType.Progress
        });
      }
    };
    // -1 to avoid the 0 at array's start
    console.log('Executing ' + process_stepsCount + ' tasks...');


    for (const task of process.process) {
      const i = process.process.indexOf(task);
      try {
        console.warn('Executing task ' + i + '/' + (process_stepsCount - 1) + ' : ' + task.baseTask.key + '...');
        const response = await task.run((c) => CreateProcessCallback(c, i));
        CreateProcessCallback(response, i);
        if (response.state === LaunchTaskState.error) {
          SetRunningVersionState(id, RunningVersionState.Error);
          resolve(<ExitedCallback>{
            progressing: {
              stepId: i,
              stepCount: process_stepsCount
            },
            type: CallbackType.Error,
            return: { reason: ExitedReason.Error, display: response.data || response.response.error }
          });
          return;
        } else {
          LaunchStorage.push({
            task: task.baseTask, response: response.response
          });
        }
      } catch (err: any) {
        resolve(<ExitedCallback>{
          progressing: {
            stepId: i,
            stepCount: process_stepsCount
          },
          type: CallbackType.Error,
          return: { reason: ExitedReason.Error, display: err }
        });
        return;
      }
    }
    console.warn('Executed all tasks ! getting launch params...');
    const java_path = LaunchStorage.find(taskResponse => taskResponse.task.key === LaunchOperationKit.ParseJava.key)?.response.data;
    const access_token = LaunchStorage[LaunchStorage.length - 1].response.data;
    if (java_path === undefined) throw new Error('Cannot get \'java_path\'');
    //access_token can be null (offline)
    CreateProcessCallback({
      state: LaunchTaskState.processing,
      displayText: 'Launching...',
      data: { localProgress: 100 }
    }, process_stepsCount - 1);
    //The "[object]" in CheckCondition function result is normal
    resolve(LaunchGameProcess(process.id, process.version, java_path, access_token, (callback: Callback) => Callback(callback)));
  });
}

function parseProcess(process: ResolvedLaunchTask[]) {
  return process.filter(task => task.baseTask.type !== LaunchOperationClass.Verify && task.baseTask.type !== LaunchOperationClass.Preload).length;
}


async function getAutorisation(): Promise<boolean> {
  console.log('Waiting for security allow...');
  //TODO: make security panel
  return true;

}


export function StopGame(processId: string) {
  console.log('Forcing stop process: ' + processId);
  const process = RunningVersionList.find(rv => rv.id === processId)?.process;
  if (process === undefined) console.raw.warn('Process of Running version ' + processId + ' is undefined');
  else {
    if (process.kill()) {
      UnregisterRunningVersion(processId);
    } else throw new Error('Cannot kill process ' + processId);
  }
}


export function getLocationRoot(): string {
  const storageRes: string | null | undefined = userDataStorage.get('saved.rootPath');
  if (storageRes !== undefined && storageRes !== null) return storageRes; else return setLocalLocationRoot(getDefaultRootPath());
}

export function getDefaultRootPath(): string {
  return getAppDataPath() + '\\.minecraft';
}

function setLocalLocationRoot(path: string) {
  userDataStorage.set('saved.rootPath', path);
  return path;
}

function LaunchGameProcess(id: string, version: GameVersion, javaPath: string, access_token: string | undefined, callback: (callback: any) => void): Promise<ExitedCallback> {
  return new Promise(async (resolve, reject) => {
    //get account data
    const account = getSelectedAccount();
    if (account === null || !isAccountValid(account)) {
      console.raw.error(id + ' Cannot launch the game without a valid logged account');
      resolve(<ExitedCallback>{
        type: CallbackType.Error,
        return: { reason: ExitedReason.Error, display: 'Cannot launch the game without a valid logged account !' }
      });
      return;
    }
    //Get running version index
    const runningVersionIndex = RunningVersionList.findIndex((rv) => rv.id === id);
    if (runningVersionIndex === -1) throw new Error('Cannot resolve Running version in list');
    //Start
    console.warn('Launching minecraft [' + id + '] ' + version.id + ' :' + '\nFor: ', account.profile, '\n from: ' + getLocationRoot() + '\n java: ' + javaPath);
    launch({
      gamePath: getLocationRoot(),
      javaPath: javaPath,
      version: version.id,
      gameProfile: { id: account.profile.id, name: account.profile.name },
      accessToken: access_token,
      launcherName: `BushLauncher`,
      launcherBrand: `BushLauncher`,
      gameName: `Bush Launcher Minecraft [${version.id}]`,
      resolution: process.env.NODE_ENV === 'development' ? {
        width: 854,
        height: 480,
        fullscreen: undefined
      } : undefined
      //TODO: set game icon, name and Discord RTC
      //TODO: Server, to launch directly on server
    }).then((process: ChildProcess) => {
      RunningVersionList[runningVersionIndex] = { ...RunningVersionList[runningVersionIndex], process: process };
      const watcher = createMinecraftProcessWatcher(process);
      watcher.on('error', (err) => console.raw.error(id + ' ' + err));
      watcher.on('minecraft-window-ready', () => {
        SetRunningVersionState(runningVersionIndex, RunningVersionState.Running);
        callback({ type: CallbackType.Success });
        console.log('Game ' + id + ' launched successfully !');
      });
      watcher.on('minecraft-exit', () => {
        console.log(id + ' Game Exited');
        resolve(<ExitedCallback>{ type: CallbackType.Exited, return: { reason: ExitedReason.Exited } });
      });
    }).catch(err => {
      console.raw.error(id + ' ' + err);
      reject(err);
    });

  });

}
