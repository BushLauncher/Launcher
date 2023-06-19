import { installTask } from '@xmcl/installer';
import { GameType, LaunchTaskState, ProgressLaunchCallback, VersionData } from './public/GameData';
import { knowGameError, knowGameErrorFormat } from './public/ErrorDecoder';
import { diagnose, MinecraftIssueReport } from '@xmcl/core';
import { ResolveXmclVersion } from './PreLaunchEngine';
import fs, { existsSync } from 'fs';
import { getLocationRoot } from './Launcher';
import path from 'path';

export async function verifyGameFiles(version: VersionData): Promise<true | MinecraftIssueReport> {
  const report = await diagnose(version.id, getLocationRoot());
  if (report.issues.length === 0) return true;
  else return report;
  //report can be analysed [https://github.com/Voxelum/minecraft-launcher-core-node/tree/master/packages/core#diagnose]
}

export async function InstallGameFiles(version: VersionData, callback: (callback: ProgressLaunchCallback) => void): Promise<void> {
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
