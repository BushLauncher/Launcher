import { installAssets, installAssetsTask, installTask } from '@xmcl/installer';
import { GameType, GameVersion, LaunchTaskState, SubLaunchTaskCallback } from '../../public/GameDataPublic';
import { diagnose, MinecraftIssueReport } from '@xmcl/core';
import { ResolveXmclVersion } from './PreLaunchEngine';
import fs, { existsSync } from 'fs';
import { getLocationRoot } from './Core';
import path from 'path';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';
import { DownloadAgent, DefaultRangePolicy } from '@xmcl/file-transfer';
import { getGlobalDispatcher } from 'undici';
import { FileHandle } from 'fs/promises';
import CachePolicy from 'http-cache-semantics';
import { errors } from 'undici';

const console = new ConsoleManager('GameFileManager', ProcessType.Internal);

export async function VerifyGameFiles(version: GameVersion, path: string): Promise<boolean | MinecraftIssueReport> {
  if (!existsSync(path)) {
    console.raw.error('path don\' exist');
    return false;
  }
  console.log(`Diagnosing ${version.gameType} ${version.id}`);
  const report = await diagnose(version.id, path);
  return (report.issues.length === 0) ? true : report;
  //report can be analysed [https://github.com/Voxelum/minecraft-launcher-core-node/tree/master/packages/core#diagnose]
}

export async function InstallGameFiles(version: GameVersion, dir: string, callback: (callback: SubLaunchTaskCallback) => void): Promise<SubLaunchTaskCallback> {
  console.log('Installing game file');
  callback({ state: LaunchTaskState.processing, displayText: 'Installing Minecraft files...' });
  switch (version.gameType) {
    case GameType.VANILLA: {
      return new Promise(async (resolve, reject): Promise<SubLaunchTaskCallback> => {
          console.warn('Installing Minecraft ' + version.gameType + ' in: ' + dir);
          const xmclVersion = await ResolveXmclVersion(version);
          const mainTask = installTask(xmclVersion, dir, {
            throwErrorImmediately: true,
            agent: new DownloadAgent(
              createDefaultRetryHandler(10),
              new DefaultRangePolicy(2 * 1024 * 1024, 10),
              getGlobalDispatcher(),
              createInMemoryCheckpointHandler()
            )
          });
          return mainTask.startAndWait({
            onUpdate(task: any, chunkSize: number) {
              //console.raw.log(task.path + ' ' + Math.floor((task.progress * 100) / task.total) + ' %');
              if (task.path === 'install') console.log('Downloading ' + Math.floor((task.progress * 100) / task.total) + '% [' + chunkSize + ']');
              const STEPCOUNT = 4;
              const getPercentage = (step: number): number => {
                return <number>(((100 * step) + Math.floor((task.progress * 100) / task.total) - 100) / STEPCOUNT);
              };
              if (task.path.startsWith('install.version.json')) {
                callback({
                  state: LaunchTaskState.processing,
                  data: { localProgress: getPercentage(1) }
                });
              } else if (task.path.startsWith('install.version.jar')) {
                callback({
                  state: LaunchTaskState.processing,
                  data: { localProgress: getPercentage(2) }
                });
              } else if (task.path.startsWith('install.dependencies.assets')) {
                callback({
                  state: LaunchTaskState.processing,
                  data: { localProgress: getPercentage(3) }
                });
              } else if (task.path.startsWith('install.dependencies.libraries')) {
                callback({
                  state: LaunchTaskState.processing,
                  data: { localProgress: getPercentage(4) }
                });
              }

              if (task.path === 'install') {
                const downloadPercentage = Math.floor((task.progress * 100) / task.total);
                //console.log("Downloading: " + task.progress + " / " + task.total);
                //https://github.com/Voxelum/minecraft-launcher-core-node/issues/275
                console.log('Downloading: ' + downloadPercentage + '%');
                callback({ state: LaunchTaskState.processing, data: { localProgress: downloadPercentage } });
              }
            }
          }).then(() => {
            console.log('finished download all');
            resolve(<SubLaunchTaskCallback>{ state: LaunchTaskState.finished });
          }).catch((err: any) => {
            console.raw.error(err);
            reject(<SubLaunchTaskCallback>{ state: LaunchTaskState.error, data: { return: err } });
          });
        }
      )
        ;
    }
    default:
      throw new Error('Cannot install GameFile for GameType: ' + version.gameType);
  }

}

export async function UninstallGameFiles(version: GameVersion, rootPath?: string, callback?: (callback: SubLaunchTaskCallback) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
    rootPath = rootPath || getLocationRoot();
    const folderPath = path.join(rootPath, 'versions', version.id);

    if (callback) callback({ state: LaunchTaskState.starting, displayText: 'Initializing...' });
    if (existsSync(folderPath)) {
      if (callback) callback({ state: LaunchTaskState.processing, displayText: 'Deleting...' });
      switch (version.gameType) {
        case GameType.VANILLA: {
//just delete version folder
          deleteFolderRecursive(folderPath);
          resolve();
          break;
        }
        default:
          throw new Error(`${version.gameType} is not implemented in 'UninstallGameFile' function`);
      }
    } else reject('Cannot find folder: ' + folderPath);
  });
}

export function findFileRecursively(path: string, targetFileName: string): string | undefined {
  const stack: string[] = [path];
  while (stack.length > 0) {
    const currentPath = stack.pop()!;
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const filePath = `${currentPath}/${file}`;
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) stack.push(filePath);
      else if (file === targetFileName) return filePath;
    }
  }
  return undefined;
}

export function deleteFolderRecursive(path: string) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file) {
      const curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        try {
          fs.unlinkSync(curPath);
        } catch (e) {
          console.warn('Skipped file: ' + curPath);
        }
      }
    });
    try {
      fs.rmdirSync(path);
    } catch (e) {
      console.warn('Skipped folder: ' + path);
    }
  }
}

/**********************************************************************/
interface DownloadCheckpoint {
  ranges: Range[];
  url: string;
  contentLength: number;
  policy: CachePolicy;
}

function createInMemoryCheckpointHandler(): any {
  const storage: Record<string, DownloadCheckpoint | undefined> = {};
  return {
    async lookup(url: URL, handle: FileHandle, destination: string) {
      const result = storage[destination];
      delete storage[destination];
      return result;
    },
    async put(url: URL, handle: FileHandle, destination: string, checkpoint: DownloadCheckpoint) {
      storage[destination] = checkpoint;
    },
    async delete(url: any, handle: any, destination: string | number) {
      delete storage[destination];
    }
  };
}

export class DownloadError extends Error {
  constructor(
    message: string,
    public urls: string[],
    readonly headers: Record<string, any>,
    readonly destination: string,
    options?: any
  ) {
    // @ts-ignore
    super(message, options);
    this.name = 'DownloadError';
  }
}

export class ValidationError extends Error {
  constructor(error: string, message?: string) {
    super(message);
    this.name = error;
  }
}

interface RetryPolicy {
  retry(url: URL, attempt: number, error: ValidationError): boolean | Promise<boolean>;

  retry(url: URL, attempt: number, error: DownloadError): boolean | Promise<boolean>;

  /**
   * You should decide whether we should retry the download again?
   *
   * @param url The current downloading url
   * @param attempt How many time it try to retry download? The first retry will be `1`.
   * @param error The error object thrown during this download. It can be {@link DownloadError} or ${@link ValidationError}.
   * @returns If we should retry and download it again.
   */
  retry(url: URL, attempt: number, error: any): boolean | Promise<boolean>;
}

function createDefaultRetryHandler(maxRetryCount = 3) {
  const handler: RetryPolicy = {
    async retry(url, attempt, error) {
      if (attempt < maxRetryCount) {
        if (error instanceof errors.HeadersTimeoutError ||
          error instanceof errors.BodyTimeoutError ||
          error instanceof (errors as any).ConnectTimeoutError ||
          error instanceof errors.SocketError) {
          setTimeout(() => {
            return true;
          }, attempt * 1000);
        }
      }
      return false;
    }
  };
  return handler;
}
