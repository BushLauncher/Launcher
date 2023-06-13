import {
  Callback,
  ErrorCallback,
  ExitedCallback,
  LaunchTaskState,
  ProgressCallback,
  StartedCallback,
  VersionData
} from './public/GameData';
import { CallbackType } from './public/ErrorDecoder';
import {
  LaunchProcess,
  LaunchRunnableProcess,
  LaunchTask,
  parseJava,
  ResolvedLaunchTask,
  resolveLaunchTask,
  resolveLaunchTaskList,
  UpdateLaunchTaskCallback
} from './LaunchEngine';
import { createMinecraftProcessWatcher, launch } from '@xmcl/core';
import { ChildProcess } from 'child_process';
import { locationRoot } from './VersionManager';

export async function Run(process: LaunchProcess | LaunchRunnableProcess, Callback: (callback: Callback) => void) {
  //resolve process list if not
  const operations: ResolvedLaunchTask[] = process.resolved ? process.actions : resolveLaunchTaskList(process.actions);
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

export function RunTask(task: ResolvedLaunchTask | LaunchTask, callback: (callback: UpdateLaunchTaskCallback) => void): Promise<UpdateLaunchTaskCallback> {
  return new Promise(async (resolve, reject) => {
    const _task = task instanceof ResolvedLaunchTask ? task : resolveLaunchTask(task);
    const result: UpdateLaunchTaskCallback = await _task.run(callback);
    resolve(result);
  });
}

export function parseLaunch(LaunchRunnable: LaunchRunnableProcess | LaunchProcess | ResolvedLaunchTask[]): number {
  return (Array.isArray(LaunchRunnable) ? LaunchRunnable.length : LaunchRunnable.actions.length) - 1;
}

export function StopGame() {
}

export function Launch(version: VersionData, callback: (callback: StartedCallback) => void): Promise<ExitedCallback> {
  return new Promise((resolve, reject) => {
    parseJava((c) => console.log('Internal Launch re-parse Java: ', c))
      .then((javaPath: string) => {
        console.log(javaPath);
        launch({
          gamePath: locationRoot,
          javaPath: javaPath,
          version: version.id,
          //TODO: add accessToken (gameProfile, accessToken)
          gameName: `BushLauncher Minecraft [${version.id}]`,
          launcherName: `BushLauncher`
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





