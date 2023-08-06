import {
  Callback,
  CallbackType,
  ErrorCallback,
  ExitedCallback,
  GameVersion,
  LaunchOperationKit,
  LaunchProcess,
  LaunchTaskState,
  PreLaunchResponse,
  ProgressCallback,
  RawLaunchProcess,
  RawLaunchTask,
  RunningVersion,
  RunningVersionState,
  SubLaunchTaskCallback
} from '../../public/GameDataPublic';
import { AnalyseLaunchProcess, ResolvedLaunchTask, ResolveLaunchTask } from './PreLaunchEngine';
import { createMinecraftProcessWatcher, launch } from '@xmcl/core';
import { ChildProcess } from 'child_process';
import { getSelectedAccount, isAccountValid } from './AuthModule';
import { net } from 'electron';
import getAppDataPath from 'appdata-path';
import { currentWindow, userDataStorage } from '../main';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';

const console = new ConsoleManager('Launcher', ProcessType.Internal);


export const RunningVersionList: RunningVersion[] = [];


export function Launch(process: RawLaunchProcess, Callback: (callback: Callback) => void) {
  console.log('Launching [' + process.id + ']');
  RunningVersionList.push({ id: process.id, Version: process.version, State: RunningVersionState.Launching });
  currentWindow?.webContents.send('UpdateMainTabsState');
  return RunLaunchProcess(process, (callback: Callback) => Callback(callback));
}

export async function RunLaunchProcess(rawProcess: RawLaunchProcess, Callback: (callback: Callback) => void): Promise<ExitedCallback | ErrorCallback> {
  return new Promise<ExitedCallback | ErrorCallback>(async (resolve, reject) => {
    //**Preload**
    const process: LaunchProcess = await AnalyseLaunchProcess(rawProcess);
    //Security check
    if (process.allowCustomOperations) {
      const res: boolean = await getAutorisation();
      if (!res) {
        console.warn('Process execution Canceled (unauthorized)');
        resolve({ type: CallbackType.Closed });
        return;
      } else console.raw.error('** Process running in insecure mode ! **');
    }
    //Add internal operations
    // (Java + GameFile at start and Account at the end)
    process.process.unshift(<ResolvedLaunchTask>ResolveLaunchTask(LaunchOperationKit.ParseJava), <ResolvedLaunchTask>ResolveLaunchTask(LaunchOperationKit.ParseGameFile));
    process.process.push(<ResolvedLaunchTask>ResolveLaunchTask(LaunchOperationKit.ParseAccount));

    //Parse process
    const stepsCount = parseProcess(process);
    const CreateCallback = (subTask: SubLaunchTaskCallback, index: number) => {
      if (subTask.state === LaunchTaskState.error) {
        Callback(<ErrorCallback>{
          stepId: index, stepCount: stepsCount, return: subTask.data?.return
        });
      } else {
        Callback(<ProgressCallback>{
          stepId: index, stepCount: stepsCount, task: subTask, type: CallbackType.Progress
        });
      }
    };
    console.log('Executing ' + stepsCount + ' tasks');
    console.raw.log(process.process);

    const LaunchStorage: { task: RawLaunchTask, response: PreLaunchResponse }[] = [];

    for (const task of process.process) {
      const i = process.process.indexOf(task);
      try {
        console.warn('Executing task ' + i + '/' + stepsCount + ' : ' + task.baseTask.key + '...');
        const response = await task.run((c) => CreateCallback(c, i));
        CreateCallback(response, i);
        if (response.state === LaunchTaskState.error) {
          resolve(<ErrorCallback>{ type: CallbackType.Error, return: response.data || response.response.error });
          return;
        } else LaunchStorage.push({
          task: task.baseTask, response: response.response
        });
      } catch (err: any) {
        resolve(<ErrorCallback>{ type: CallbackType.Error, return: err });
        return;
      }
    }
    console.warn('Executed all tasks ! Launching...');

    setTimeout(() => {
      resolve(<ExitedCallback>{ type: CallbackType.Closed });
    }, 2000);
  });
}

function parseProcess(process: LaunchProcess) {
  return process.process.length;
}


async function getAutorisation(): Promise<boolean> {
  console.log('Waiting for security allow...');
  //TODO: make security panel
  return true;

}

/**
 * @deprecated
 */

/*export async function RunPreLaunchProcess(baseProcess: LaunchProcess, Callback: (callback: Callback) => void) {
  //resolve process list if not
  const operations: ResolvedPreLaunchTask[] = ResolveLaunchProcessTasks(baseProcess.actions);
  //Add internal operations
  operations.unshift(...getLaunchInternal(baseProcess.version));
  const stepsCount = parseLaunch(operations);
  //Execute each task
  const createCallback = (callback: UpdateLaunchTaskCallback, index: number) => {
    if (callback.state === LaunchTaskState.error) Callback(<ErrorCallback>{
      stepId: index,
      stepCount: stepsCount,
      return: callback.data?.return
    });
    else Callback(<ProgressCallback>{
      stepId: index,
      stepCount: stepsCount,
      task: callback,
      type: CallbackType.Progress
    });
  };

  let responseStorage: (PreLaunchResponse & { task: string })[] = [];


  for (const operation of operations) {
    const i = operations.indexOf(operation);
    console.warn('[' + baseProcess.id + '] Executing task ' + (i + 1) + '/' + (stepsCount + 1) + ' : ' + operation.getId());
    const taskCallback = await RunTask(operation, (c) => createCallback(c, i)).catch(err => {
      console.raw.error(baseProcess.id + ' ' + err);
      throw new Error(err);
    });
    //responseStorage.push({ task: taskCallback.task, ...taskCallback.response });
    createCallback(<UpdateLaunchTaskCallback>taskCallback, i);
    //verify the response
    if (taskCallback.state === LaunchTaskState.error || !taskCallback.response.success) break;
  }
  const version: GameVersion = baseProcess.version;
  const javaPath: string | undefined = responseStorage.find((response) => response.task === LaunchOperation.ParseJava)?.data;
  if (javaPath === undefined) throw  new Error('We couldn\'t retrieve javaPath !');
  const access_token: string | null = responseStorage.find((response) => response.task === LaunchOperation.ParseAccount)?.data;
  CleanUpCatch();

  //Launch
    createCallback(<UpdateLaunchTaskCallback>{
      task: { task: 'Launch', params: {} },
      state: LaunchTaskState.processing,
      displayText: 'Launching...',
      data: {
        localProgress: 100
      }
    }, stepsCount);
    return LaunchGameProcess(baseProcess.id, version, javaPath, access_token, (callback: StartedCallback) => Callback(callback));

}
*/

export function StopGame(processId: string) {
  console.log('Forcing stop process: ' + processId);
  const process = RunningVersionList[resolveIndexInList(processId)].process;
  if (process === undefined) console.warn('Process of Running version ' + processId + ' is undefined'); else process.kill();
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

function LaunchGameProcess(id: string, version: GameVersion, javaPath: string, access_token: string | null, callback: (callback: any) => void): Promise<ExitedCallback> {
  return new Promise(async (resolve, reject) => {
    const account = getSelectedAccount();
    if (account === null || !isAccountValid(account)) {
      console.raw.error(id + ' Cannot launch the game without a valid logged account');
      reject();
      return;
    }
    console.log(' Launching minecraft [' + id + '] ' + version.id + ' :' + '\nFor: ', account.profile, '\n from: ' + getLocationRoot() + '\n java: ' + javaPath);
    launch({
      gamePath: getLocationRoot(),
      javaPath: javaPath,
      version: version.id,
      gameProfile: { id: account.profile.id, name: account.profile.name },
      accessToken: net.isOnline() && access_token ? access_token : undefined,
      launcherName: `BushLauncher`,
      launcherBrand: `BushLauncher`,
      gameName: `Bush Launcher Minecraft [${version.id}]`
      //TODO: set game icon, name and Discord RTC
      //TODO: Server, to launch directly on server
    }).then((process: ChildProcess) => {
      RunningVersionList[resolveIndexInList(id)] = {
        ...RunningVersionList[resolveIndexInList(id)], process: process
      };
      const watcher = createMinecraftProcessWatcher(process);
      watcher.on('error', (err) => console.raw.error(id + ' ' + err));
      watcher.on('minecraft-window-ready', () => {
        RunningVersionList[resolveIndexInList(id)] = {
          ...RunningVersionList[resolveIndexInList(id)], State: RunningVersionState.Running
        };
        currentWindow?.webContents.send('UpdateMainTabsState');
        callback({ type: CallbackType.Success });
      });
      watcher.on('minecraft-exit', () => {
        console.log(id + ' Game Exited');
        resolve(<ExitedCallback>{ type: CallbackType.Closed });
        RunningVersionList.splice(resolveIndexInList(id), 1);
        currentWindow?.webContents.send('UpdateMainTabsState');
      });
    }).catch(err => {
      console.raw.error(id + ' ' + err);
      reject(err);
    });

  });

}


function resolveIndexInList(id: string) {
  const index = RunningVersionList.findIndex((rv) => rv.id === id);
  if (index === -1) throw new Error('Cannot resolve Running version in list'); else return index;
}
