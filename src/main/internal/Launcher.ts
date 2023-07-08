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
  PreLaunchTasks,
  ProgressCallback,
  StartedCallback,
  UpdateLaunchTaskCallback
} from '../../public/GameDataPublic';
import { ResolvedPreLaunchTask, ResolvePreLaunchTask, ResolvePreLaunchTaskList } from './PreLaunchEngine';
import { createMinecraftProcessWatcher, launch } from '@xmcl/core';
import { ChildProcess } from 'child_process';
import { getSelectedAccount, isAccountValid } from './AuthModule';
import { net } from 'electron';
import getAppDataPath from 'appdata-path';
import { userDataStorage } from '../main';
import { getLaunchInternal } from './PreLaunchProcessPatern';

const prefix = '[Launcher]: ';

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
    console.warn('Executing task ' + (i + 1) + '/' + (stepsCount + 1) + ' : ' + operation.getId());
    const taskCallback = await RunTask(operation, (c) => createCallback(c, i)).catch(err => {
      console.error(prefix + err);
      throw new Error(err);
    });
    responseStorage.push({ task: taskCallback.task.id, ...taskCallback.response });
    createCallback(<UpdateLaunchTaskCallback>taskCallback, i);
    //verify the response
    if (taskCallback.state === LaunchTaskState.error || !taskCallback.response.success) break;
  }
  const version: GameVersion = baseProcess.version;
  const javaPath: string | undefined = responseStorage.find((response) => response.task === PreLaunchTasks.ParseJava)?.data;
  if (javaPath === undefined) throw  new Error('We couldn\'t retrieve javaPath !');
  const access_token: string | null = responseStorage.find((response) => response.task === PreLaunchTasks.ParseAccount)?.data;


  //Launch
  if (baseProcess.launch) {
    createCallback(<UpdateLaunchTaskCallback>{
      task: { id: 'Launch', params: {} },
      state: LaunchTaskState.processing,
      displayText: 'Launching...',
      data: {
        localProgress: 100
      }
    }, stepsCount);
    return Launch(version, javaPath, access_token, (callback: StartedCallback) => Callback(callback));
  } else return;

}

export function RunTask(task: ResolvedPreLaunchTask | LaunchTask, callback: (callback: UpdateLaunchTaskCallback) => void): Promise<FinishedSubTaskCallback> {
  return new Promise(async (resolve) => {
    const _task = task instanceof ResolvedPreLaunchTask ? task : ResolvePreLaunchTask(task);
    try {
      resolve(await _task.run(callback));
    } catch (err) {
      console.error(prefix + 'Cannot execute task', err);
    }
  });
}

function parseLaunch(LaunchRunnable: PreLaunchRunnableProcess | PreLaunchProcess | ResolvedPreLaunchTask[]): number {
  return (Array.isArray(LaunchRunnable) ? LaunchRunnable.length : LaunchRunnable.actions.length) - 1;
}

export function StopGame() {
  //Need stored launched version list
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

export function Launch(version: GameVersion, javaPath: string, access_token: string | null, callback: (callback: StartedCallback) => void): Promise<ExitedCallback> {
  return new Promise(async (resolve, reject) => {
    const account = getSelectedAccount();
    if (account === null || !isAccountValid(account)) {
      console.error('Cannot launch the game without a valid logged account');
      reject();
      return;
    }

    console.log(prefix + 'Launching minecraft ' + version.id + ' :' + '\nFor: ', account.profile, '\n from: ' + getLocationRoot() + '\n java: ' + javaPath);
    launch({
      gamePath: getLocationRoot(),
      javaPath: javaPath,
      version: version.id,
      gameProfile: { id: account.profile.id, name: account.profile.name },
      accessToken: net.isOnline() && access_token ? access_token : undefined,
      launcherName: `BushLauncher`,
      launcherBrand: `BushLauncher`,
      gameName: `BushLauncher Minecraft [${version.id}]`
      //TODO: set game icon, name and Discord RTC
      //TODO: Server, to launch directly on server
    }).then((process: ChildProcess) => {
      const watcher = createMinecraftProcessWatcher(process);
      watcher.on('error', (err) => console.error(prefix + err));
      watcher.on('minecraft-window-ready', () => {
        callback(<StartedCallback>{ type: CallbackType.Success, return: undefined });
      });
      watcher.on('minecraft-exit', () => {
        console.log(prefix + 'Exited');
        resolve(<ExitedCallback>{ type: CallbackType.Closed });
      });
    }).catch(err => {
      console.error(prefix + err);
      reject(err);
    });

  });

}





