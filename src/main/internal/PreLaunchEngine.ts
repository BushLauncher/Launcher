import * as AccountManager from './AuthModule';
import { getAccessToken } from './AuthModule';
import {
  CallbackType,
  ErrorCallback,
  FinishedSubTaskCallback,
  GameType,
  GameVersion,
  LaunchOperationClass,
  LaunchOperationKit,
  LaunchProcess,
  LaunchTaskState,
  RawLaunchOperationList,
  RawLaunchProcess,
  RawLaunchTask,
  SubLaunchTaskCallback
} from '../../public/GameDataPublic';
import { getVersionList, MinecraftVersion } from '@xmcl/installer';
import { InstallGameFiles, VerifyGameFiles } from './GameFileManager';
import { isSupported, versionExist } from './VersionManager';
import { InstallJava, ResolveJavaPath } from './JavaEngine';
import { net } from 'electron';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';
import { Launch } from './Core';

const console = new ConsoleManager('LaunchEngine', ProcessType.Internal);


export abstract class ResolvedLaunchTask {
  public type!: LaunchOperationClass;
  public baseTask: RawLaunchTask;

  protected constructor(baseTask: RawLaunchTask, type: LaunchOperationClass) {
    //console.log('Creating task: ' + baseTask.key + '[', baseTask.params, ']');
    this.baseTask = baseTask;
    this.type = type;
  }

  public getId() {
    return this.baseTask.key;
  }

  public abstract run(callback: (callback: SubLaunchTaskCallback) => void): Promise<FinishedSubTaskCallback>;

  public getCallback(processingCallback: SubLaunchTaskCallback): SubLaunchTaskCallback {
    return {
      task: this.baseTask,
      state: LaunchTaskState.processing,
      displayText: processingCallback.displayText ? processingCallback.displayText : undefined,
      data: {
        return: processingCallback.data?.return ? processingCallback.data.return : undefined,
        localProgress: processingCallback.data?.localProgress ? processingCallback.data.localProgress : undefined
      }
    };
  }

}

export class ParseAccount extends ResolvedLaunchTask {
  constructor(baseTask: RawLaunchTask) {
    super(baseTask, LaunchOperationClass.Parse);
  }

  public override async run(callback: (callback: SubLaunchTaskCallback) => void) {
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

export class ParseJava extends ResolvedLaunchTask {
  constructor(baseTask: RawLaunchTask) {
    super(baseTask, LaunchOperationClass.Parse);
  }

  public override async run(callback: (callback: SubLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking Java...' });
    const data = await parseJava((c: SubLaunchTaskCallback) => callback(this.getCallback(c))).catch(err => {
      console.raw.error(err);
      return <FinishedSubTaskCallback>{
        task: this.baseTask, state: LaunchTaskState.finished, response: { success: false }
      };
    });
    return <FinishedSubTaskCallback>{
      task: this.baseTask, state: LaunchTaskState.finished, response: { success: true, data: data }
    };
  }
}

export interface ParseGameFileLaunchTask extends RawLaunchTask {
  params: { version: GameVersion };
}

export class ParseGameFile extends ResolvedLaunchTask {
  constructor(baseTask: ParseGameFileLaunchTask) {
    super(baseTask, LaunchOperationClass.Parse);
  }

  public override async run(callback: (callback: SubLaunchTaskCallback) => void) {
    //Analyse params
    if (this.baseTask.params === undefined || !(await isSupported(this.baseTask.params.version))) {
      console.raw.error('Passed version is not valid !');
      return <FinishedSubTaskCallback>{
        task: this.baseTask,
        state: LaunchTaskState.error,
        response: { error: 'Passed version is not valid' }
      };
    }
    //Execute
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking Minecraft files...' });
    await parseGameFile(this.baseTask.params.version, (c: SubLaunchTaskCallback) => callback(this.getCallback(c))).catch(err => {
      console.raw.error(err);
      return <FinishedSubTaskCallback>{
        task: this.baseTask, state: LaunchTaskState.error, response: { success: false }
      };
    });
    return <FinishedSubTaskCallback>{
      task: this.baseTask, state: LaunchTaskState.finished, response: { success: true }
    };
  }
}

export function ResolveLaunchTask(task: RawLaunchTask): ResolvedLaunchTask | undefined {
  //convert
  switch (task.key) {
    case 'InstallExternal' :
      throw new Error('Unimplemented function');
    case 'ParseBootstrap' :
      throw new Error('Unimplemented function');
    case 'ParseMods' :
      throw new Error('Unimplemented function');
    case 'ParseOptifine' :
      throw new Error('Unimplemented function');
    case 'ParseResources' :
      throw new Error('Unimplemented function');
    case 'GetPreloadData' :
      throw new Error('Unimplemented function');
    case 'ParseAccount' :
      return new ParseAccount(task);
    case 'ParseGameFile' :
      return new ParseGameFile(<ParseGameFileLaunchTask>task);
    case 'ParseJava' :
      return new ParseJava(task);
    case 'ResolveProcess' :
      throw new Error('Unimplemented function');
    case 'Launch' :
      throw new Error('Unimplemented function');
    case 'CheckServer' :
      throw new Error('Unimplemented function');
    case 'CheckCondition' :
      throw new Error('Unimplemented function');
    case 'RunFile' :
      throw new Error('Unimplemented function');
    case 'SetConfig' :
      throw new Error('Unimplemented function');
    default :
      return undefined;
  }
}

export function AnalyseLaunchProcess(rawProcess: RawLaunchProcess): Promise<LaunchProcess> {
  return new Promise(async (resolve, reject) => {
    //set undefined const
    rawProcess.manual = rawProcess.manual || false;
    rawProcess.allowCustomOperations = rawProcess.allowCustomOperations || false;
    //Verify version validity
    if (!(await isSupported(rawProcess.version))) reject(<ErrorCallback>{
      type: CallbackType.Error,
      return: `Version [${rawProcess.version.gameType}] ${rawProcess.version.id}, is not supported !`
    });
    //Verify game type
    if (!Object.keys(GameType).includes(rawProcess.version.gameType)) reject(<ErrorCallback>{
      type: CallbackType.Error, return: `Process type ${rawProcess.version.gameType}, is not supported !`
    });
    //Add internal operations
    rawProcess.process.push(LaunchOperationKit.ParseJava, {
      ...LaunchOperationKit.ParseGameFile,
      params: { version: rawProcess.version }
    });
    //Reorder tasks
    let resolvedTaskList: ResolvedLaunchTask[] = [];
    rawProcess.process
      //Analyse
      .filter((t) => {
        if (RawLaunchOperationList.find((task) => t.key === task.key) !== undefined) return true;
        else {
          console.warn(`(Analyse) Task named "${t.key}" isn't recognized \n -> (it was ignored)`);
          return false;
        }
      })
      //Sort the tasks with theirs type (if process is not custom)
      .sort((a, b) => !rawProcess.internal ? Object.keys(LaunchOperationClass).indexOf(a.type.toString()) - Object.keys(LaunchOperationClass).indexOf(b.type.toString()) : 0)
      //Push executable version of tasks
      .map(((t, i) => {
        const task = ResolveLaunchTask(t);
        if (task === undefined) throw new Error(`Task ${t.key} couldn't be resolved \n (task bypassed the analyse !)`); else resolvedTaskList[i] = task;
      }));
    //Add Account operation
    resolvedTaskList.push(<ResolvedLaunchTask>ResolveLaunchTask(LaunchOperationKit.ParseAccount));
    //AUTOMATIONS
    if (!rawProcess.manual) {
      let automationCount: number = 0;
      //
      console.log(automationCount > 0 ? 'Ran ' + automationCount + ' automations.' : 'No automations ran.');
    }
    //TODO: check for mods compatibilities
    //Recompose process
    const resolvedProcess: LaunchProcess = { ...rawProcess, process: resolvedTaskList };
    resolve(resolvedProcess);
  });
}

export function parseGameFile(version: GameVersion, callback: (callback: SubLaunchTaskCallback) => void): Promise<void> {
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


    if (!versionExist(version.id)) await Install(); else {
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
  });
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
export function parseJava(callback: (c: SubLaunchTaskCallback) => void): Promise<string> {
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
  if (res === undefined) throw new Error('Cannot resolve version from XMCL lib'); else return res;
}
