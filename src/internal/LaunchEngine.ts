import * as AccountManager from './AuthModule';
import { knowGameError, knowGameErrorFormat } from './public/ErrorDecoder';
import {
  LaunchOperationType,
  LaunchTaskState,
  ProgressLaunchCallback,
  ResolvedLaunchOperation,
  sendUnImplementedException,
  UpdateLaunchTaskCallback,
  VersionData
} from './public/GameData';
import { MinecraftIssueReport } from '@xmcl/core';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { getVersionList, MinecraftVersion } from '@xmcl/installer';
import { InstallGameFiles, resolveJavaPath, verifyGameFiles } from './GameFileManager';
import { versionExist } from './VersionManager';
import axios from 'axios';
import admZip from 'adm-zip';

export type LaunchTask = {
  id: string,
  params?: any
}

export abstract class ResolvedLaunchTask {
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

export class VerifyAccount extends ResolvedLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Verify);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking account...' });
    const data = parseAccount();
    return <UpdateLaunchTaskCallback>{ task: this.baseTask, state: LaunchTaskState.finished, data: { return: data } };
  }
}

export class ParseJava extends ResolvedLaunchTask {
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

export class ParseGameFile extends ResolvedLaunchTask {
  constructor(baseTask: ParseGameFileLaunchTask) {
    super(baseTask, LaunchOperationType.Parse);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void) {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Checking Minecraft files...' });
    await parseGameFile(this.baseTask.params.version, (c: ProgressLaunchCallback) => callback(this.getCallback(c))).catch(err => console.error(err));
    return <UpdateLaunchTaskCallback>{ task: this.baseTask, state: LaunchTaskState.finished };
  }
}

export class VerifyGameFile extends ResolvedLaunchTask {
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
export class InstallBootstrap extends ResolvedLaunchTask {
  constructor(baseTask: LaunchTask) {
    super(baseTask, LaunchOperationType.Install);
  }

  public override async run(callback: (callback: UpdateLaunchTaskCallback) => void): Promise<UpdateLaunchTaskCallback> {
    callback({ task: this.baseTask, state: LaunchTaskState.starting, displayText: 'Installing Game Bootstrap...' });
    return sendUnImplementedException(this.baseTask);
  }
}

export const resolveLaunchTask: (baseTask: LaunchTask | ParseGameFileLaunchTask) => ResolvedLaunchTask = (baseTask) => {
  switch (baseTask.id) {
    case'VerifyAccount':
      return new VerifyAccount(baseTask);
    case 'ParseJava':
      return new ParseJava(baseTask);
    case 'ParseGameFile':
      return new ParseGameFile(<ParseGameFileLaunchTask>baseTask);
    case 'VerifyGameFile':
      return new VerifyGameFile(baseTask);
    case 'InstallBootstrap':
      return new InstallBootstrap(baseTask);
    default:
      throw new Error('Operation ' + baseTask.id + ' not founded !');
  }

};

export function resolveLaunchTaskList(launchOperation: LaunchTask[]): ResolvedLaunchTask[] {
  let taskList: ResolvedLaunchTask[] = [];
  launchOperation.map((task, i) => {
    taskList.push(resolveLaunchTask(task));
  });
  return taskList;
}

export interface LaunchProcess {
  actions: LaunchTask[];
  resolved: false;
  internal: false;
  version: VersionData;
  launch: boolean;
}

export interface LaunchRunnableProcess {
  actions: ResolvedLaunchOperation[];
  resolved: true;
  internal?: boolean;
  version: VersionData;
  launch: boolean;
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

async function installJava(callback: (c: ProgressLaunchCallback) => void): Promise<string> {
  console.log('installing...');
  callback({ state: LaunchTaskState.processing, displayText: 'Installing Java...' });
  const dir = path.join(app.getPath('userData'), 'Local Java\\');
  const tempDownloadDir = path.join(app.getPath('userData'), 'Download Cache\\');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  if (!fs.existsSync(tempDownloadDir)) fs.mkdirSync(tempDownloadDir);
  const downloadData = await getJavaDownloadLink();
  const zipPath = path.join(tempDownloadDir, downloadData.name);
  //remove the extension: .zip
  const destPath = path.join(dir, downloadData.name.replace('\\.([a-z]*$)', ''));
  return new Promise<string>((resolve, reject) => {
    console.log('Create stream');
    const stream = fs.createWriteStream(zipPath);
    console.log('Downloading...');
    callback({ state: LaunchTaskState.processing, displayText: 'Downloading Java...' });
    axios.get(downloadData.link, {
      responseType: 'stream',
      onDownloadProgress: progressEvent => {
        const downloadPercentage = Math.floor(
          (progressEvent.loaded * 100) / (progressEvent.total ? progressEvent.total : downloadData.size)
        );
        console.log('Downloading Java: ' + downloadPercentage + '%');
        callback({
          state: LaunchTaskState.processing,
          displayText: 'Downloading Java...',
          localProgress: downloadPercentage
        });
      }
    })
      .then(axiosResponse => {
        return new Promise<void>((resolve, reject) => {
          callback({ state: LaunchTaskState.processing, displayText: 'Writing Java...' });
          axiosResponse.data.pipe(stream)
            .on('finish', () => {
              stream.end();
              resolve();
            })
            .on('error', (error: any) => {
              reject(error);
              stream.end();
            });
        });
      })
      .then(() => {
        console.log('Extraction started');
        callback({ state: LaunchTaskState.processing, displayText: 'Extracting Java...' });
        return new admZip(zipPath).extractAllTo(destPath, false, true);
      })
      .then(() => {
        console.log('Extraction completed');
        // Handle further operations after successful extraction
        resolve(destPath);
      })
      .catch(err => console.error(err));

  });
}

type JavaDownloadData = {
  link: string,
  name: string,
  size: number,
  releaseLink: string
}

async function getJavaDownloadLink(): Promise<JavaDownloadData> {
  return new Promise((resolve, reject) => {
    let os: string = process.platform;
    if (os === 'win32') os = 'windows';
    if (os === 'darwin') os = 'mac';
    const url = `https://api.adoptium.net/v3/assets/latest/8/hotspot?architecture=x64&image_type=jre&os=${os}&vendor=eclipse`;
    axios.get(url, {
      responseType: 'json'
    })
      .then(jsonResponse => {
        const packages = jsonResponse.data[0].binary.package;
        resolve({
          link: packages.link,
          name: packages.name,
          size: packages.size,
          releaseLink: jsonResponse.data[0].release_link
        });
      }).catch(err => {
      console.error('We couldn\'t get the json download data for ' + os);
      console.error(err);
      reject(<knowGameErrorFormat>{ ...knowGameError.JavaCannotGetDownloadDataError, additionalError: err });
    });
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

export { UpdateLaunchTaskCallback };

