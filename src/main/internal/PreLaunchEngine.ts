import * as AccountManager from './AuthModule';
import { getAccessToken } from './AuthModule';
import {
  FinishedSubTaskCallback,
  GameVersion,
  LaunchOperationType,
  LaunchTask,
  LaunchTaskState,
  PreLaunchError,
  LaunchOperation,
  ProgressSubTaskCallback,
  UpdateLaunchTaskCallback
} from '../../public/GameDataPublic';
import { getVersionList, MinecraftVersion } from '@xmcl/installer';
import { InstallGameFiles, VerifyGameFiles } from './GameFileManager';
import { versionExist } from './VersionManager';
import { InstallJava, ResolveJavaPath } from './JavaEngine';
import { net } from 'electron';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';

const console = new ConsoleManager("LaunchEngine", ProcessType.Internal)


export abstract class ResolvedPreLaunchTask {
  public type!: LaunchOperationType;
  public baseTask: LaunchTask;

  protected constructor(baseTask: LaunchTask, type: LaunchOperationType) {
    console.log('Creating task: ' + baseTask.task + '[', baseTask.params, ']');
    this.baseTask = baseTask;
    this.type = type;
  }

  public getId() {
    return this.baseTask.task;
  }

  public abstract run(callback: (callback: UpdateLaunchTaskCallback) => void): Promise<FinishedSubTaskCallback>;

  public getCallback(processingCallback: ProgressSubTaskCallback): UpdateLaunchTaskCallback {
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

export class ParseAccount extends ResolvedPreLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Parse);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking account...' });
    const data = await parseAccount();
    return <FinishedSubTaskCallback>{
      task: this.baseTask,
      state: LaunchTaskState.finished,
      data: { return: data },
      response: { success: typeof data === 'string', data: data }
    };
  }
}

export class ParseJava extends ResolvedPreLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Parse);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking Java...' });
    const data = await parseJava((c: ProgressSubTaskCallback) => callback(this.getCallback(c))).catch(err=>{
      console.error(err)
      return <FinishedSubTaskCallback>{task: this.baseTask, state: LaunchTaskState.finished, response: { success: false }}
    })
    return <FinishedSubTaskCallback>{
      task: this.baseTask, state: LaunchTaskState.finished, response: { success: true, data: data }
    };
  }
}

export interface ParseGameFileLaunchTask extends LaunchTask {
  params: { version: GameVersion };
}

export class ParseGameFile extends ResolvedPreLaunchTask {
  constructor(baseTask: ParseGameFileLaunchTask) {
    super(baseTask, LaunchOperationType.Parse);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking Minecraft files...' });
    await parseGameFile(this.baseTask.params.version, (c: ProgressSubTaskCallback) => callback(this.getCallback(c))).catch(err => {
      console.error(err);
      return <FinishedSubTaskCallback>{
        task: this.baseTask,
        state: LaunchTaskState.error,
        response: { success: false }
      };
    });
    return <FinishedSubTaskCallback>{
      task: this.baseTask,
      state: LaunchTaskState.finished,
      response: { success: true }
    };
  }
}

export class VerifyGameFile extends ResolvedPreLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Verify);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Verifying Minecraft Files...' });
    const report = await VerifyGameFiles(this.baseTask.params.version).catch(err=>{console.error(err); return <FinishedSubTaskCallback>{ task: this.baseTask, state: LaunchTaskState.error, response: {success: false, data: err} }})
    return <FinishedSubTaskCallback>{ task: this.baseTask, state: LaunchTaskState.finished, data: { return: report }, response: {success: true, data: report} };
  }
}

//Minecraft craft bootstrapper like Forge, Fabric ect...
export class InstallBootstrap extends ResolvedPreLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Install);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Installing Game Bootstrap...' });
    return sendUnImplementedException(this.baseTask);
  }
}

export function sendUnImplementedException(task: LaunchTask): FinishedSubTaskCallback {
  const message = `Function ${task.task} is not implemented`;
  return {
    task: task,
    displayText: message,
    state: LaunchTaskState.error,
    response: <PreLaunchError>{ error: message, success: false }
  };
}

export const ResolvePreLaunchTask: (baseTask: LaunchTask | ParseGameFileLaunchTask) => ResolvedPreLaunchTask = (baseTask) => {
  switch (baseTask.task) {
    case LaunchOperation.ParseAccount:
      return new ParseAccount(baseTask);
    case LaunchOperation.ParseJava:
      return new ParseJava(baseTask);
    case LaunchOperation.ParseGameFile:
      return new ParseGameFile(<ParseGameFileLaunchTask>baseTask);
    case LaunchOperation.VerifyGameFile:
      return new VerifyGameFile(baseTask);
    case LaunchOperation.InstallBootstrap:
      return new InstallBootstrap(baseTask);
    default:
      throw new Error(`Operation ${baseTask.task} not founded !`);
  }

};

export function ResolvePreLaunchTaskList(launchOperation: LaunchTask[]): ResolvedPreLaunchTask[] {
  let taskList: ResolvedPreLaunchTask[] = [];
  launchOperation.map((task) => {
    taskList.push(ResolvePreLaunchTask(task));
  });
  return taskList;
}


export function parseGameFile(version: GameVersion, callback: (callback: ProgressSubTaskCallback) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
      const Install = () => InstallGameFiles(version, (c) => callback(c))
        .then(async () => {
          console.log('Installed Minecraft files !');
          const report = await VerifyGameFiles(version);
          if (report !== true) {
            throw new Error('Cannot install Minecraft File, Minecraft\'s installed game files are corrupted\n' + report);
          } else {
            callback({ state: LaunchTaskState.finished });
            resolve();
          }
        })
        .catch((err) => reject(err));


      if (!versionExist(version.id)) await Install();
      else {
        //check for corruption
        callback({ state: LaunchTaskState.processing, displayText: 'Checking Minecraft file...' });
        const checkResult = await VerifyGameFiles(version /*no Callback needed*/);
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

/**
 * @return the access_token or *false* if account not valid
 */
export async function parseAccount(): Promise<string | null | false> {
  const account = AccountManager.getSelectedAccount();
  if (account != null && AccountManager.isAccountValid(account)) {
    return net.isOnline() ? (await getAccessToken(account)).access_token : null;
  } else return false;
}

/**
 * @return The (installed | founded) Java executable path
 * @param callback installation callback
 */
export function parseJava(callback: (c: ProgressSubTaskCallback) => void): Promise<string> {
  return new Promise<string>(async (resolve) => {
    console.log('Parsing java...');
    callback({ state: LaunchTaskState.processing, displayText: 'Parsing Java...' });
    const resolvedJavaPath = await ResolveJavaPath();
    if (typeof resolvedJavaPath === 'string') {
      console.log('java paths detected');
      resolve(resolvedJavaPath);
    } else resolve(await InstallJava((c) => callback(c)));
  });
}

export async function ResolveXmclVersion(version: GameVersion): Promise<MinecraftVersion> {
  const versionList = await getVersionList();
  const res = versionList.versions.find((MinecraftVersion) => {
    return MinecraftVersion.id === version.id;
  });
  if (res === undefined) throw new Error('Cannot resolve version from XMCL lib');
  else return res;
}
