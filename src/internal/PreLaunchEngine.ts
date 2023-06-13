import * as AccountManager from './AuthModule';
import {
  LaunchOperationType,
  LaunchTask,
  LaunchTaskState,
  PreLaunchTasks,
  ProgressLaunchCallback,
  sendUnImplementedException,
  UpdateLaunchTaskCallback,
  VersionData
} from './public/GameData';
import { MinecraftIssueReport } from '@xmcl/core';
import { getVersionList, MinecraftVersion } from '@xmcl/installer';
import { InstallGameFiles, verifyGameFiles } from './GameFileManager';
import { versionExist } from './VersionManager';
import { installJava, resolveJavaPath } from './JavaEngine';

export abstract class ResolvedPreLaunchTask {
  public type!: LaunchOperationType;
  public baseTask: LaunchTask;

  protected constructor(baseTask: LaunchTask, type: LaunchOperationType) {
    console.log('Creating task: ' + baseTask.id + '[', baseTask.params, ']');
    this.baseTask = baseTask;
    this.type = type;
  }

  public getId() {
    return this.baseTask.id;
  }

  public abstract run(callback: (callback: UpdateLaunchTaskCallback) => void): Promise<UpdateLaunchTaskCallback>;

  public getCallback(processingCallback: ProgressLaunchCallback): UpdateLaunchTaskCallback {
    return {
      task: this.baseTask,
      state: LaunchTaskState.processing,
      displayText: processingCallback.displayText ? processingCallback.displayText : undefined,
      data: {
        return: processingCallback.return ? processingCallback.return : undefined,
        localProgress: processingCallback.localProgress ? processingCallback.localProgress : undefined
      }
    };
  }

}

export class VerifyAccount extends ResolvedPreLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Verify);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking account...' });
    const data = parseAccount();
    return <UpdateLaunchTaskCallback>{ task: this.baseTask, state: LaunchTaskState.finished, data: { return: data } };
  }
}

export class ParseJava extends ResolvedPreLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Parse);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking Java...' });
    const data = await parseJava((c: ProgressLaunchCallback) => callback(this.getCallback(c)));
    return <UpdateLaunchTaskCallback>{
      task: this.baseTask, state: LaunchTaskState.finished, data: {
        return: data
      }
    };
  }
}

export interface ParseGameFileLaunchTask extends LaunchTask {
  params: { version: VersionData };
}

export class ParseGameFile extends ResolvedPreLaunchTask {
  constructor(baseTask: ParseGameFileLaunchTask) {
    super(baseTask, LaunchOperationType.Parse);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking Minecraft files...' });
    await parseGameFile(this.baseTask.params.version, (c: ProgressLaunchCallback) => callback(this.getCallback(c))).catch(err => console.error(err));
    return <UpdateLaunchTaskCallback>{ task: this.baseTask, state: LaunchTaskState.finished };
  }
}

export class VerifyGameFile extends ResolvedPreLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Verify);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void): Promise<UpdateLaunchTaskCallback> {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Verifying Minecraft Files...' });
    const report = await verifyGameFiles(this.baseTask.params.version);
    return { task: this.baseTask, state: LaunchTaskState.finished, data: { return: report } };
  }
}

//Minecraft craft bootstrapper like Forge, Fabric ect...
export class InstallBootstrap extends ResolvedPreLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Install);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void): Promise<UpdateLaunchTaskCallback> {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Installing Game Bootstrap...' });
    return sendUnImplementedException(this.baseTask);
  }
}


export const resolvePreLaunchTask: (baseTask: LaunchTask | ParseGameFileLaunchTask) => ResolvedPreLaunchTask = (baseTask) => {
  switch (baseTask.id) {
    case PreLaunchTasks.VerifyAccount:
      return new VerifyAccount(baseTask);
    case PreLaunchTasks.ParseJava:
      return new ParseJava(baseTask);
    case PreLaunchTasks.ParseGameFile:
      return new ParseGameFile(<ParseGameFileLaunchTask>baseTask);
    case PreLaunchTasks.VerifyGameFile:
      return new VerifyGameFile(baseTask);
    case PreLaunchTasks.InstallBootstrap:
      return new InstallBootstrap(baseTask);
    default:
      throw new Error(`Operation ${baseTask.id} not founded !`);
  }

};

export function resolvePreLaunchTaskList(launchOperation: LaunchTask[]): ResolvedPreLaunchTask[] {
  let taskList: ResolvedPreLaunchTask[] = [];
  launchOperation.map((task, i) => {
    taskList.push(resolvePreLaunchTask(task));
  });
  return taskList;
}


export function parseGameFile(version: VersionData, callback: (callback: ProgressLaunchCallback) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
      const Install = () => InstallGameFiles(version, (c) => callback(c))
        .then(() => {
          console.log('Installed Minecraft files !');
          verifyGameFiles(version)
            .then(async (report: true | MinecraftIssueReport) => {
              if (report !== true) {
                console.error(report);
                throw new Error('Cannot install Minecraft File, Minecraft\'s installed game files are corrupted\n' + report);
              } else {
                callback({ state: LaunchTaskState.finished });
                resolve();
              }
            }).catch(err => reject(err));
        })
        .catch((err) => reject(err));


      if (!versionExist(version.id)) await Install();
      else {
        //check for corruption
        callback({ state: LaunchTaskState.processing, displayText: 'Checking Minecraft file...' });
        const checkResult = await verifyGameFiles(version /*no Callback needed*/);
        if (checkResult === true) {
          callback({ state: LaunchTaskState.finished });
          resolve();
        } else {
          callback({ state: LaunchTaskState.processing, displayText: 'Repairing Minecraft Files...' });
          await Install();
        }
      }
    }
  );
}

export function parseAccount(): boolean {
  const account = AccountManager.getSelectedAccount();
  return (account != null && AccountManager.isAccountValid(account));
}

export function parseJava(callback: (c: ProgressLaunchCallback) => void): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    console.log('Parsing java...');
    callback({ state: LaunchTaskState.processing, displayText: 'Parsing Java...' });
    const resolvedJavaPath = await resolveJavaPath();
    if (typeof resolvedJavaPath === 'string') {
      console.log('java paths detected');
      resolve(resolvedJavaPath);
    } else resolve(await installJava((c) => callback(c)));
  });
}

export async function ResolveXmclVersion(version: VersionData): Promise<MinecraftVersion> {
  const versionList = await getVersionList();
  //.find can be null, but normally passed version id's exist
  // @ts-ignore
  return versionList.versions.find((MinecraftVersion, i) => {
    return MinecraftVersion.id === version.id;
  });
}
