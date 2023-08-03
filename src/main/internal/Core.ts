import {
  Callback,
  CallbackType,
  ErrorCallback,
  ExitedCallback,
  FinishedSubTaskCallback,
  GameVersion,
  LaunchTask,
  LaunchTaskState,
  PreLaunchProcess,
  PreLaunchResponse,
  PreLaunchRunnableProcess,
  LaunchOperation,
  ProgressCallback,
  RunningVersion,
  RunningVersionState,
  StartedCallback,
  UpdateLaunchTaskCallback
} from '../../public/GameDataPublic';
import { ResolvedPreLaunchTask, ResolvePreLaunchTask, ResolvePreLaunchTaskList } from './PreLaunchEngine';
import { createMinecraftProcessWatcher, launch } from '@xmcl/core';
import { ChildProcess } from 'child_process';
import { getSelectedAccount, isAccountValid } from './AuthModule';
import { net } from 'electron';
import getAppDataPath from 'appdata-path';
import { currentWindow, userDataStorage } from '../main';
import { getLaunchInternal } from './PreLaunchProcessPatern';
import { CleanUpCatch } from './UserData';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';

const console = new ConsoleManager("Launcher", ProcessType.Internal)


export const RunningVersionList: RunningVersion[] = [];

export async function RunPreLaunchProcess(baseProcess: PreLaunchProcess | PreLaunchRunnableProcess, Callback: (callback: Callback) => void) {
  //resolve process list if not
  const operations: ResolvedPreLaunchTask[] = (baseProcess.resolved) ? baseProcess.actions : ResolvePreLaunchTaskList(baseProcess.actions);
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
      console.error(baseProcess.id + ' ' + err);
      throw new Error(err);
    });
    responseStorage.push({ task: taskCallback.task.id, ...taskCallback.response });
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
  if (baseProcess.launch) {
    createCallback(<UpdateLaunchTaskCallback>{
      task: { task: 'Launch', params: {} },
      state: LaunchTaskState.processing,
      displayText: 'Launching...',
      data: {
        localProgress: 100
      }
    }, stepsCount);
    return LaunchGameProcess(baseProcess.id, version, javaPath, access_token, (callback: StartedCallback) => Callback(callback));
  } else return;

}

export function RunTask(task: ResolvedPreLaunchTask | LaunchTask, callback: (callback: UpdateLaunchTaskCallback) => void): Promise<FinishedSubTaskCallback> {
  return new Promise(async (resolve) => {
    const _task = task instanceof ResolvedPreLaunchTask ? task : ResolvePreLaunchTask(task);
    try {
      resolve(await _task.run(callback));
    } catch (err) {
      console.error('Cannot execute task', err);
    }
  });
}

function parseLaunch(LaunchRunnable: PreLaunchRunnableProcess | PreLaunchProcess | ResolvedPreLaunchTask[]): number {
  return (Array.isArray(LaunchRunnable) ? LaunchRunnable.length : LaunchRunnable.actions.length) - 1;
}

export function StopGame(processId: string) {
  console.log("Forcing stop process: " + processId)
  const process = RunningVersionList[resolveIndexInList(processId)].process;
  if (process === undefined) console.warn('Process of Running version ' + processId + ' is undefined');
  else process.kill();
}


export function getLocationRoot(): string {
  const storageRes: string | null | undefined = userDataStorage.get('saved.rootPath');
  if (storageRes !== undefined && storageRes !== null) return storageRes;
  else return setLocalLocationRoot(getDefaultRootPath());
}

export function getDefaultRootPath(): string {
  return getAppDataPath() + '\\.minecraft';
}

function setLocalLocationRoot(path: string) {
  userDataStorage.set('saved.rootPath', path);
  return path;
}

function LaunchGameProcess(id: string, version: GameVersion, javaPath: string, access_token: string | null, callback: (callback: StartedCallback) => void): Promise<ExitedCallback> {
  return new Promise(async (resolve, reject) => {
    const account = getSelectedAccount();
    if (account === null || !isAccountValid(account)) {
      console.error(id + ' Cannot launch the game without a valid logged account');
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
        ...RunningVersionList[resolveIndexInList(id)],
        process: process
      };
      const watcher = createMinecraftProcessWatcher(process);
      watcher.on('error', (err) => console.error(id + ' ' + err));
      watcher.on('minecraft-window-ready', () => {
        RunningVersionList[resolveIndexInList(id)] = {
          ...RunningVersionList[resolveIndexInList(id)],
          State: RunningVersionState.Running
        };
        currentWindow?.webContents.send('UpdateMainTabsState');
        callback(<StartedCallback>{ type: CallbackType.Success, return: undefined });
      });
      watcher.on('minecraft-exit', () => {
        console.log(id + ' Game Exited');
        resolve(<ExitedCallback>{ type: CallbackType.Closed });
        RunningVersionList.splice(resolveIndexInList(id), 1);
        currentWindow?.webContents.send('UpdateMainTabsState');
      });
    }).catch(err => {
      console.error(id + ' ' + err);
      reject(err);
    });

  });

}


export function Launch(process: PreLaunchProcess | PreLaunchRunnableProcess, Callback: (callback: Callback) => void) {
  RunningVersionList.push({
    id: process.id,
    Version: process.version,
    State: RunningVersionState.Launching
  });
  currentWindow?.webContents.send('UpdateMainTabsState');
  return RunPreLaunchProcess(process, (callback: Callback) => Callback(callback));
}


function resolveIndexInList(id: string) {
  const index = RunningVersionList.findIndex((rv) => rv.id === id);
  if (index === -1) throw new Error('Cannot resolve Running version in list');
  else return index;
}
