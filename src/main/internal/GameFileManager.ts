import { installTask } from '@xmcl/installer';
import { GameType, GameVersion, LaunchTaskState, ProgressSubTaskCallback } from '../../public/GameDataPublic';
import { knowErrorFormat, knowGameError } from '../../public/ErrorPublic';
import { diagnose, MinecraftIssueReport } from '@xmcl/core';
import { ResolveXmclVersion } from './PreLaunchEngine';
import fs, { existsSync } from 'fs';
import { getLocationRoot } from './Launcher';
import path from 'path';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';

const console = new ConsoleManager("GameFileManager", ProcessType.Internal)
export async function VerifyGameFiles(version: GameVersion, path?: string): Promise<true | MinecraftIssueReport> {
  return new Promise(async (resolve, reject) => {
    path = path || getLocationRoot();
    if (!existsSync(path)) reject('path don\' exist');
    console.log(`Diagnosing ${version.gameType} ${version.id}`);
    const report = await diagnose(version.id, path);
    resolve((report.issues.length === 0) ? true : report);
    //report can be analysed [https://github.com/Voxelum/minecraft-launcher-core-node/tree/master/packages/core#diagnose]
  });
}

export async function InstallGameFiles(version: GameVersion, callback: (callback: ProgressSubTaskCallback) => void): Promise<void> {
  console.log('Installing game file');
  callback({ state: LaunchTaskState.processing, displayText: 'Installing Minecraft files...' });
  switch (version.gameType) {
    case GameType.VANILLA: {
      return new Promise(async (resolve, reject) => {
        const dir = getLocationRoot();
        console.warn('Installing Minecraft ' + version.gameType + ' in: ' + dir);
        const task = installTask(await ResolveXmclVersion(version), dir, {});
        await task.startAndWait({
          onUpdate(task: any, chunkSize: number) {
            //use only global task called "install"
            if (task.path === 'install') {
              const downloadPercentage = Math.floor((task.progress * 100) / task.total);
              //console.log("Downloading: " + task.progress + " / " + task.total);
              //https://github.com/Voxelum/minecraft-launcher-core-node/issues/275
              console.log('Downloading: ' + downloadPercentage + '%');
              callback({ state: LaunchTaskState.processing, localProgress: downloadPercentage });
            }
          },
          onFailed(task: any, error: any) {
            reject(<knowErrorFormat>{ ...knowGameError.GameFileCannotInstallError, additionalError: error });
          },
          onSucceed(task: any, result: any) {
            if (task.path === 'install') {
              console.log('finished download all');
              resolve();
            }
          }
        });
      });
    }
    default:
      throw new Error('Cannot install GameFile for GameType: ' + version.gameType);

  }

}

export async function UninstallGameFiles(version: GameVersion, rootPath?: string, callback?: (callback: ProgressSubTaskCallback) => void): Promise<void> {
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
