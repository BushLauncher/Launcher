import { getPotentialJavaLocations, installTask } from '@xmcl/installer';
import { GameType, LaunchTaskState, ProgressLaunchCallback, VersionData } from './public/GameData';
import { knowGameError, knowGameErrorFormat } from './public/ErrorDecoder';
import { diagnose, MinecraftIssueReport } from '@xmcl/core';
import { ResolveXmclVersion } from './LaunchEngine';
import { locationRoot } from './VersionManager';
import { userDataStorage } from '../main/main';
import fs from 'fs';

export async function verifyGameFiles(version: VersionData): Promise<true | MinecraftIssueReport> {
  const report = await diagnose(version.id, locationRoot);
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
        const dir = locationRoot;
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


export async function resolveJavaPath(): Promise<string | undefined> {
  const saved = getSavedJavaPath();
  if (saved !== undefined) return saved;
  return await findJava();
}

export function getSavedJavaPath(): string | undefined {
  const path: string | null | undefined = userDataStorage.get('saved.javaPath');
  return (path != null && fs.existsSync(path)) ? path : undefined;
}

export function findJava(): Promise<string | undefined> {
  return new Promise(async (resolve, reject) => {
    await getPotentialJavaLocations()
      .then((pathList: string[]) => {
        //test for result
        for (const path of pathList) {
          if (fs.existsSync(path)) {
            resolve(path);
            return;
          }
        }
        //if pathList empty or all tested path aren't valid
        resolve(undefined);
      }).catch(err => reject(err));
  });
}
