import {
  Callback,
  ErrorCallback,
  ExitedCallback,
  LaunchTask,
  LaunchTaskState,
  PreLaunchProcess,
  PreLaunchRunnableProcess,
  ProgressCallback,
  StartedCallback,
  UpdateLaunchTaskCallback,
  VersionData
} from './public/GameData';
import { CallbackType } from './public/ErrorDecoder';
import { parseJava, ResolvedPreLaunchTask, resolvePreLaunchTask, resolvePreLaunchTaskList } from './PreLaunchEngine';
import { createMinecraftProcessWatcher, launch } from '@xmcl/core';
import { ChildProcess } from 'child_process';
import { getSelectedAccount, isAccountValid } from './AuthModule';
import { MicrosoftAuthenticator } from '@xmcl/user';
import { net } from 'electron';
import getAppDataPath from 'appdata-path';
import { userDataStorage } from '../main/main';

export async function RunPreLaunchProcess(process: PreLaunchProcess | PreLaunchRunnableProcess, Callback: (callback: Callback) => void) {
  //resolve process list if not
  const operations: ResolvedPreLaunchTask[] = process.resolved ? process.actions : resolvePreLaunchTaskList(process.actions);
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

  for (const operation of operations) {
    const i = operations.indexOf(operation);
    console.warn('Executing task ' + (i + 1) + '/' + (stepsCount + 1) + ' : ' + operation.getId());
    createCallback(<UpdateLaunchTaskCallback>await RunTask(operation, (c) => createCallback(c, i)).catch(err => {
      console.error(err);
      throw new Error(err);
    }), i);
  }

  //Launch
  if (process.launch) {
    createCallback(<UpdateLaunchTaskCallback>{
      task: { id: 'Launch', params: {} },
      state: LaunchTaskState.processing,
      displayText: 'Starting...',
      data: {
        localProgress: 100
      }
    }, stepsCount);
    return Launch(process.version, (callback: StartedCallback) => Callback(callback));

  }

}

export function RunTask(task: ResolvedPreLaunchTask | LaunchTask, callback: (callback: UpdateLaunchTaskCallback) => void): Promise<UpdateLaunchTaskCallback> {
  return new Promise(async (resolve, reject) => {
    const _task = task instanceof ResolvedPreLaunchTask ? task : resolvePreLaunchTask(task);
    try {
      const result: UpdateLaunchTaskCallback = await _task.run(callback);
      resolve(result);
    } catch (err) {
      console.error('Cannot execute task', err);
    }
  });
}

export function parseLaunch(LaunchRunnable: PreLaunchRunnableProcess | PreLaunchProcess | ResolvedPreLaunchTask[]): number {
  return (Array.isArray(LaunchRunnable) ? LaunchRunnable.length : LaunchRunnable.actions.length) - 1;
}

export function StopGame() {
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

export function Launch(version: VersionData, callback: (callback: StartedCallback) => void): Promise<ExitedCallback> {
  return new Promise(async (resolve, reject) => {
    const account = getSelectedAccount();
    if (account === null || !isAccountValid(account)) throw new Error('Cannot launch the game without valid logged account');
    const getAccessToken = async () => {
      const authenticator = new MicrosoftAuthenticator();
      const { xstsResponse, xboxGameProfile } = await authenticator.acquireXBoxToken(account.msToken.access_token);
      return await authenticator.loginMinecraftWithXBox(xstsResponse.DisplayClaims.xui[0].uhs, xstsResponse.Token);
    };
    parseJava((c) => console.log('Internal Launch re-parse Java: ', c))
      .then(async (javaPath: string) => {
        console.log('Launching minecraft ' + version.id + ' :' + '\nFor: ', account.profile, '\n from: ' + getLocationRoot() + '\n java: ' + javaPath + '\n...');
        launch({
          gamePath: getLocationRoot(),
          javaPath: javaPath,
          version: version.id,
          gameProfile: { id: account.profile.id, name: account.profile.name },
          accessToken: net.isOnline() ? (await getAccessToken()).access_token : undefined,
          launcherName: `BushLauncher`,
          launcherBrand: `BushLauncher`,
          gameName: `BushLauncher Minecraft [${version.id}]`
          //TODO: set game icon name and Discord RTC
          //TODO: Server, to launch directly on server
        }).then((process: ChildProcess) => {
          const watcher = createMinecraftProcessWatcher(process);
          watcher.on('error', (err) => console.error(err));
          watcher.on('minecraft-window-ready', () => {
            callback(<StartedCallback>{ type: CallbackType.Success, return: undefined });
          });
          watcher.on('minecraft-exit', () => {
            console.log('Exited');
            resolve(<ExitedCallback>{ type: CallbackType.Closed });
          });
        }).catch(err => console.error(err));
      })
      .catch(err => {
        console.error(err.additionalError[0].segmentErrors[0]);
        reject({ type: CallbackType.Error, return: err });
      });
  });

}





