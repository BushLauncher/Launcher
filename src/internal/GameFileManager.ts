import { installTask } from '@xmcl/installer';
import { GameType, LaunchTaskState, ProgressSubTaskCallback, VersionData } from './public/GameData';
import { knowGameError, knowGameErrorFormat } from './public/ErrorDecoder';
import { diagnose, MinecraftIssueReport } from '@xmcl/core';
import { ResolveXmclVersion } from './PreLaunchEngine';
import fs, { existsSync } from 'fs';
import { getLocationRoot } from './Launcher';
import path from 'path';

export async function verifyGameFiles(version: VersionData, path?: string): Promise<true | MinecraftIssueReport> {
  return new Promise(async (resolve, reject) => {
    path = path || getLocationRoot();
    if (!existsSync(path)) reject('path don\' exist');
    console.log(`Diagnosing ${version.gameType} ${version.id}`);
    const report = await diagnose(version.id, path);
    if (report.issues.length === 0) resolve(true);
    else resolve(report);
    //report can be analysed [https://github.com/Voxelum/minecraft-launcher-core-node/tree/master/packages/core#diagnose]
  });
}

export async function InstallGameFiles(version: VersionData, callback: (callback: ProgressSubTaskCallback) => void): Promise<void> {
  console.log('Installing game file');
  callback({ state: LaunchTaskState.processing, displayText: 'Installing Minecraft files...' });
  switch (version.gameType) {
    case GameType.VANILLA: {
      return new Promise(async (resolve, reject) => {
        const dir = getLocationRoot();
        //TODO: add configurable .minecraft path
        console.warn('Installing Minecraft ' + version.gameType + ' in: ' + dir);
        const task = installTask(await ResolveXmclVersion(version), dir, {});
        await task.startAndWait({
          onUpdate(task: any, chunkSize: number) {
            //use only global task called "install"
            if (task.path === 'install') {
              const downloadPercentage = Math.floor((task.progress * 100) / task.total);
              console.log('Downloading: ' + downloadPercentage + '%');
              callback({ state: LaunchTaskState.processing, localProgress: downloadPercentage });
            }
          },
          onFailed(task: any, error: any) {
            reject(<knowGameErrorFormat>{ ...knowGameError.GameFileCannotInstallError, additionalError: error });
          },
          onSucceed(task: any, result: any) {
            console.log(task.path);
            if (task.path === 'install') resolve();
          }
        });
      });
    }
    default: {
      throw new Error('Cannot install GameFile for GameType: ' + version.gameType);
    }
  }

}

export async function UninstallGameFiles(version: VersionData, rootPath?: string, callback?: (callback: ProgressSubTaskCallback) => void): Promise<void> {
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
          setTimeout(() => resolve(), 20000);
          break;
        }
        default:
          throw new Error(version.gameType + ' is not implemented in \'UninstallGameFile\' function');
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

const deleteFolderRecursive = function(path: string) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file) {
      const curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};
