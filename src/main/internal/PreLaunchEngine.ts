import * as AccountManager from './AuthModule';
import { getAccessToken } from './AuthModule';
import {
  CallbackType,
  Condition,
  ExitedCallback,
  ExitedReason,
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
  ServiceCondition,
  SubLaunchTaskCallback
} from '../../public/GameDataPublic';
import { getVersionList, MinecraftVersion } from '@xmcl/installer';
import { InstallGameFiles, VerifyGameFiles } from './GameFileManager';
import { isSupported, versionExist } from './VersionManager';
import { InstallJava, ResolveJavaPath } from './JavaEngine';
import { net } from 'electron';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';
import { Compile, CompileService } from './ConditionCompiler';

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

/********/

export interface CheckConditionParams extends Omit<RawLaunchTask, 'params'> {
  params: { condition: Condition[] | Condition, stopOnFalse: boolean };
}

export class CheckCondition extends ResolvedLaunchTask {
  constructor(baseTask: CheckConditionParams) {
    super(baseTask, LaunchOperationClass.Parse);
  }

  public override async run(callback: (callback: SubLaunchTaskCallback) => void) {
    //Analyse params
    if (this.baseTask.params !== undefined) {
      if (this.baseTask.params.condition === undefined) {
        console.raw.error('function to check is undefined !');
        return <FinishedSubTaskCallback>{
          task: this.baseTask,
          state: LaunchTaskState.error,
          response: { error: 'function to check is undefined !' }
        };
      }
      if (this.baseTask.params.stopOnFalse === undefined) this.baseTask.params.stopOnFalse = true;
    } else {
      console.raw.error('Condition cannot be compiled: no param');
      return <FinishedSubTaskCallback>{
        task: this.baseTask,
        state: LaunchTaskState.error,
        response: { error: this.baseTask.key + ': no params' }
      };
    }
    //Execute
    const conditions: Condition | Condition[] = this.baseTask.params.condition;
    console.log('Compiling ' + (Array.isArray(conditions) ? conditions.length : 1) + ' condition', (this.baseTask.params.stopOnFalse ? ' And stopping if false' : ''));
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking integrity...' });
    const conditionResult = Compile(this.baseTask.params.conditions);
    return <FinishedSubTaskCallback>{
      task: this.baseTask,
      state: LaunchTaskState.finished,
      displayText: (conditionResult.var !== undefined ? conditionResult.var + ' doesn\'t match' : undefined),
      response: { success: true, data: conditionResult }
    };
  }
}

export interface CheckServiceParams extends Omit<RawLaunchTask, 'params'> {
  params: { condition: ServiceCondition, stopOnFalse: boolean };
}

export class CheckService extends ResolvedLaunchTask {
  constructor(baseTask: CheckServiceParams) {
    super(baseTask, LaunchOperationClass.Parse);
  }

  public override async run(callback: (callback: SubLaunchTaskCallback) => void) {
    //Analyse params
    if (this.baseTask.params !== undefined) {
      if (this.baseTask.params.stopOnFalse === undefined) this.baseTask.params.stopOnFalse = true;
      if (this.baseTask.params.condition === undefined) {
        console.raw.error('service to check is undefined !');
        return <FinishedSubTaskCallback>{
          task: this.baseTask,
          state: LaunchTaskState.error,
          response: { success: false, error: 'service to check is undefined !' }
        };
      } else {
        if (this.baseTask.params.condition.address === undefined) {
          console.raw.error('address to check is undefined !');
          return <FinishedSubTaskCallback>{
            task: this.baseTask,
            state: LaunchTaskState.error,
            response: { success: false, error: 'address to check is undefined !' }
          };
        }
        if (this.baseTask.params.condition.state === undefined) console.raw.warn('state to check is undefined (condition will always return true)');
      }
    } else {
      console.raw.error('Condition cannot be compiled: no param');
      return <FinishedSubTaskCallback>{
        task: this.baseTask,
        state: LaunchTaskState.error,
        response: { success: false, error: this.baseTask.key + ': no params' }
      };
    }
    //Execute
    const condition: ServiceCondition = this.baseTask.params.condition;
    console.log('Compiling ' + (Array.isArray(condition) ? condition.length : 1) + ' condition', (this.baseTask.params.stopOnFalse ? ' And stopping if false' : ''));
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking services...' });
    let conditionResult = await CompileService(condition);
    console.log(conditionResult);
    if (typeof conditionResult === 'string') {
      return <FinishedSubTaskCallback>{
        task: this.baseTask,
        state: LaunchTaskState.error,
        displayText: conditionResult,
        response: { success: false, error: conditionResult }
      };
    } else {
      return <FinishedSubTaskCallback>{
        task: this.baseTask,
        state: LaunchTaskState.finished,
        response: { success: true, data: conditionResult }
      };
    }
  }
}

export class ParseAccount extends ResolvedLaunchTask {
  constructor(baseTask: RawLaunchTask) {
    super(baseTask, LaunchOperationClass.Parse);
  }

  public override async run(callback: (callback: SubLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking account...' });
    const data = await parseAccount((c: SubLaunchTaskCallback) => callback(this.getCallback(c)));
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

/************/
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
    case 'CheckService' :
      return new CheckService(<CheckServiceParams>task);
    case 'CheckCondition' :
      return new CheckCondition(<CheckConditionParams>task);
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
      if (!(await isSupported(rawProcess.version))) reject(<ExitedCallback>{
        type: CallbackType.Error,
        return: {
          reason: ExitedReason.Error,
          display: `Version [${rawProcess.version.gameType}] ${rawProcess.version.id}, is not supported !`
        }
      });
      //Verify game type
      if (!Object.keys(GameType).includes(rawProcess.version.gameType)) reject(<ExitedCallback>{
        type: CallbackType.Error, return: {
          reason: ExitedReason.Error, display: `Process type ${rawProcess.version.gameType}, is not supported !`
        }
      });
      //Add internal operations
      rawProcess.process.push(LaunchOperationKit.ParseJava, {
        ...LaunchOperationKit.ParseGameFile,
        params: { version: rawProcess.version }
      });
      //Reorder tasks
      let resolvedTaskList: ResolvedLaunchTask[] = [];
      const preloadFunctions: RawLaunchTask[] = [];
      rawProcess.process = rawProcess.process
        //Analyse
        .filter((t) => {
          if (RawLaunchOperationList.find((task) => t.key === task.key) !== undefined) return true;
          else {
            console.warn(`(Analyse) Task named "${t.key}" isn't recognized \n(it was ignored)`);
            return false;
          }
        })
        //Filter Verify & Preload functions to move theme in verifyProcess
        .filter((task) => {
          if (task.type === LaunchOperationClass.Verify || task.type === LaunchOperationClass.Preload) {
            preloadFunctions.push(task);
            return false;
          } else return true;
        })
        //Sort the tasks with theirs type (if process is not custom)
        .sort((a, b) => !rawProcess.internal ? Object.keys(LaunchOperationClass).indexOf(a.type.toString()) - Object.keys(LaunchOperationClass).indexOf(b.type.toString()) : 0)
        //Push executable version of tasks
        .map(((t, i) => {
          const task = ResolveLaunchTask(t);
          if (task === undefined) throw new Error(`Task ${t.key} couldn't be resolved \n (task bypassed the analyse !)`);
          else resolvedTaskList[i] = task;
          return t;
        }));
      //
      //Compile VerifyProcess
      let preloadProcess: ResolvedLaunchTask[] = [];
      //Push executable version of tasks
      preloadFunctions.map((t, i) => {
        if (t.type !== LaunchOperationClass.Verify && t.type !== LaunchOperationClass.Preload) throw new Error('Function doesn\'t have the right type and has been ordered incorrectly !');
        const task = ResolveLaunchTask(t);
        if (task === undefined) throw new Error(`Task ${t.key} couldn't be resolved \n (task bypassed the analyse !)`);
        else preloadProcess[i] = task;
      });

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
      const resolvedProcess: LaunchProcess = { ...rawProcess, process: resolvedTaskList, preloadProcess: preloadProcess };
      resolve(resolvedProcess);
    }
  )
    ;
}

/************/


function parseGameFile(version: GameVersion, callback: (callback: SubLaunchTaskCallback) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const Install = (operation: 'Install' | 'Repaire') => InstallGameFiles(version, (c) => {
      if (operation === 'Repaire') c.displayText = c.displayText?.replace('Installing', 'Repairing');

      callback(c);
    })
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


    if (!versionExist(version.id)) await Install('Install'); else {
      //check for corruption
      callback({ state: LaunchTaskState.processing, displayText: 'Checking Minecraft file...' });
      const checkResult = await VerifyGameFiles(version /*no Callback needed*/);
      if (checkResult === true) {
        callback({ state: LaunchTaskState.finished });
        resolve();
      } else {
        callback({ state: LaunchTaskState.processing, displayText: 'Repairing Minecraft Files...' });
        await Install('Repaire');
      }
    }
  });
}

/**
 * @return the access_token or *false* if account not valid
 */
async function parseAccount(callback: (callback: SubLaunchTaskCallback) => void): Promise<string | undefined | false> {
  const account = AccountManager.getSelectedAccount();
  if (account != null && AccountManager.isAccountValid(account)) {
    callback({
      state: LaunchTaskState.processing,
      data: { localProgress: 50 },
      displayText: 'Getting account access...'
    });
    return net.isOnline() ? (await getAccessToken(account)).access_token : undefined;
  } else return false;
}

/**
 * @return The (installed | founded) Java executable path
 * @param callback installation callback
 */
function parseJava(callback: (c: SubLaunchTaskCallback) => void): Promise<string> {
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
