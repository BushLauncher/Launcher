import {
  GameType,
  GameVersion,
  JsonVersionList,
  LaunchTaskState,
  SubLaunchTaskCallback
} from '../types/Versions';
import {
  diagnose,
  diagnoseAssetIndex,
  diagnoseAssets,
  diagnoseJar,
  diagnoseLibraries,
  MinecraftFolder,
  ResolvedLibrary,
  ResolvedVersion,
  Version
} from '@xmcl/core';
import fs, { existsSync } from 'fs';
import path from 'path';
import Path, { join } from 'path';
import axios from 'axios';
import { InstallLibraryTask } from '@xmcl/installer';
import getAppDataPath from 'appdata-path';
import parse = Version.parse;
import ConsoleManager, { ProcessType } from '../global/ConsoleManager';
import { getDataStorage } from './main';

const console = new ConsoleManager('GameFileManager', ProcessType.Internal);

type progressCallbackFunction = (localProgress: number | undefined, displayText?: string, subText?: string | undefined) => void;

export async function InstallGame(version: GameVersion, dir: string, callback: (callback: SubLaunchTaskCallback) => void): Promise<SubLaunchTaskCallback> {
  const sendError = (error: any) => {
    console.raw.error(error);
    return <SubLaunchTaskCallback>{ state: LaunchTaskState.error, data: { return: error } };
  };
  const sendProgress = (localProgress: number | undefined, step: number, displayText?: string, subText?: string | undefined) => {
    const totalSteps = 5;
    callback({
      state: LaunchTaskState.processing, data: {
        localProgress: localProgress === undefined ? undefined : (((step - 1) / totalSteps) * 100 + localProgress / totalSteps),
        subDisplay: subText
      }, displayText
    });
  };

  callback({ state: LaunchTaskState.processing, displayText: 'Installing Minecraft...' });
  //STEP 1
  //verify paths
  sendProgress(undefined, 1, 'Preparing for installation...');
  if (!fs.existsSync(dir)) {
    console.log('Create folder: ' + dir);
    fs.mkdirSync(dir);
  }

  //parse version
  const versionFolder = path.join(dir, 'versions', version.id);
  if (!fs.existsSync(path.join(dir, 'versions'))) fs.mkdirSync(path.join(dir, 'versions'));
  if (!fs.existsSync(versionFolder)) fs.mkdirSync(versionFolder);
  const minecraftFolder = new MinecraftFolder(dir);

  if (!fs.existsSync(path.join(dir, 'versions', version.id, version.id + '.json'))) await DownloadJSON(version, dir, (lp, d, s) => sendProgress(lp, 2, d, s), sendError);
  const versionData = await parse(dir, version.id);
  //STEP 2
  sendProgress(undefined, 2, 'Checking Minecraft Client...');
  const jsonReport = await diagnoseAssetIndex(versionData, minecraftFolder);
  const jarReport = await diagnoseJar(versionData, minecraftFolder);
  await DownloadVersion(version, versionData, dir, (lp, d, s) => sendProgress(lp, 3, d, s), sendError, {
    jar: jarReport !== undefined, json: jsonReport !== undefined
  });
  //install assets
  //STEP 3
  sendProgress(undefined, 3, 'Checking Minecraft Assets...');
  if (versionData.assetIndex?.url === undefined) throw new Error('assetIndex is undefined !'); else await DownloadAssets(version, versionData.assetIndex.url, dir, (lp, d, s) => sendProgress(lp, 4, d, s), sendError);
  //STEP 4
  //install libs
  await DownloadLibs(version, versionData, dir, (lp, d, s) => sendProgress(lp, 5, d, s), sendError);

  //verify install
  console.log('Finished, verifying...');
  callback({ state: LaunchTaskState.processing, displayText: 'Finishing Install...' });
  let mainReport = await DiagnoseVersion(version, dir);
  if (mainReport.issues.length > 0) {
    console.raw.error('Following error occurred during install', mainReport.issues);
    return { state: LaunchTaskState.error, data: { return: mainReport } };
  } else {
    console.log('Done.');
    return { state: LaunchTaskState.finished };
  }
}

async function DownloadVersion(version: GameVersion, versionData: ResolvedVersion | undefined, dir: string, sendProgress: progressCallbackFunction, onError: (e: any) => void, options?: {
  json: boolean, jar: boolean
}): Promise<SubLaunchTaskCallback> {
  const versionFolder = path.join(dir, 'versions', version.id);

  if (!fs.existsSync(path.join(dir, 'versions'))) fs.mkdirSync(path.join(dir, 'versions'));
  if (!fs.existsSync(versionFolder)) fs.mkdirSync(versionFolder);
  //install json
  if (options === undefined || options.json) {
    await DownloadJSON(version, dir, sendProgress, onError);
  }
  if (options === undefined || options.jar) {
    versionData = versionData || await parse(dir, version.id);
    return await DownloadJar(version, versionData, dir, sendProgress, onError);
  }
  return { state: LaunchTaskState.finished };
}

async function DownloadJSON(version: GameVersion, dir: string, sendProgress: progressCallbackFunction, onError: (e: any) => void) {
  const versionFolder = path.join(dir, 'versions', version.id);
  const versionData = await parseVersionData(version.id);
  console.log('Installing json...');
  try {
    sendProgress(undefined, 'Installing Minecraft Index...');
    fs.writeFileSync(path.join(versionFolder, version.id + '.json'), JSON.stringify(versionData), 'utf8');
  } catch (e) {
    console.raw.error('Cannot write json file:');
    onError(e);
    return { state: LaunchTaskState.error, data: { return: e } };
  }
}

async function DownloadJar(version: GameVersion, versionData: ResolvedVersion, dir: string, sendProgress: progressCallbackFunction, onError: (e: any) => void) {
  //install jar
  //STEP 3
  const versionFolder = path.join(dir, 'versions', version.id);
  console.log('Installing jar...');
  try {
    // noinspection ExceptionCaughtLocallyJS
    if (versionData.downloads.client === undefined) throw new Error('Client download is undefined !');
    const res = await axios.get(versionData.downloads.client.url, {
      responseType: 'arraybuffer', onDownloadProgress: (progress) => {
        const p = progress.progress === undefined ? undefined : Math.floor(progress.progress * 100);
        sendProgress(p, 'Installing Minecraft Jar...', ('Jar: ' + p + '%'));
      }
    });
    const data = Buffer.from(res.data, 'binary');
    sendProgress(undefined, 'Writing Minecraft Jar...');

    fs.writeFileSync(path.join(versionFolder, version.id + '.jar'), data);

    console.log('Finish patch version');
    return { state: LaunchTaskState.finished };
  } catch (e) {
    console.raw.error('Cannot write Jar:');
    onError(e);
    return { state: LaunchTaskState.error };
  }

}

async function DownloadAssets(version: GameVersion, assetUrl: string, dir: string, sendProgress: progressCallbackFunction, onError: (e: any) => void, options?: {
  force: boolean
}): Promise<SubLaunchTaskCallback> {
  //asset index
  sendProgress(undefined, 'Getting Minecraft assets...');
  let assetList: { [key: string]: { hash: string, size: number } } = {};
  ///
  console.log('Parsing asset list...');
  try {
    if (!fs.existsSync(path.join(dir, 'assets'))) fs.mkdirSync(path.join(dir, 'assets'));
    if (!fs.existsSync(path.join(dir, 'assets/indexes'))) fs.mkdirSync(path.join(dir, 'assets/indexes'));
    const response = await axios.get(assetUrl, { responseType: 'json' });
    const fileName = assetUrl.slice(assetUrl.lastIndexOf('/') + 1, assetUrl.length);
    console.log(fileName);
    fs.writeFileSync(path.join(dir, 'assets/indexes', fileName), JSON.stringify(response.data), 'utf8');
    assetList = response.data.objects;
    if (assetList === undefined) return { state: LaunchTaskState.error, data: { return: 'Cannot get asset list' } };
    if (options === undefined || !options.force) {
      //filter by default, replacing all list by only missing assets
      const assetReport = await diagnoseAssets(assetList, new MinecraftFolder(dir));
      let newList: { [key: string]: { hash: string, size: number } } = {};
      assetReport.forEach(report => Object.assign(newList, {
        [report.asset.name]: {
          hash: report.asset.hash, size: report.asset.size
        }
      }));
      assetList = newList;
    }
  } catch (e) {
    console.raw.error('Cannot write assets json index file:');
    onError(e);
  }
  sendProgress(undefined, 'Installing Minecraft assets...');
  //download assets
  const ASSET_URL = 'https://resources.download.minecraft.net/';
  const download_concurrency = 10;
  const assetErrors: any[] = [];
  let proceedAssetCount = 0;
  const assetPath = path.join(dir, 'assets/objects');
  if (!fs.existsSync(assetPath)) fs.mkdirSync(assetPath);
  //Construct
  const assetOperations: (() => Promise<void>)[] = Object.values(assetList)
    .map((asset, assetIndex) => {
      return () => new Promise<void>(async (resolve, reject) => {
        try {
          const downloadUrl = path.join(ASSET_URL, asset.hash.slice(0, 2), asset.hash);
          const localPath = path.join(assetPath, asset.hash.slice(0, 2), asset.hash);
          //Create folder
          if (!fs.existsSync(path.join(assetPath, asset.hash.slice(0, 2)))) fs.mkdirSync(path.join(assetPath, asset.hash.slice(0, 2)));
          //Download
          const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
          //Write
          fs.writeFileSync(localPath, Buffer.from(response.data));
          //Done
          sendProgress(((proceedAssetCount * 100) / assetCount), 'Installing Minecraft assets...', proceedAssetCount + '/' + assetCount);
          proceedAssetCount++;
          //console.log(`Downloaded asset [${assetIndex}]: ${Math.floor((proceedAssetCount * 100) / assetCount)}%`);
          resolve();
        } catch (e) {
          //console.raw.error(assetIndex + ':  ', e);
          assetErrors.push({ id: assetIndex, error: e });
          reject(e);
        }
      });
    });
  //
  const assetCount = Object.keys(assetOperations).length;
  console.log('Downloading: ' + assetCount + ' assets, by group of ' + download_concurrency + '...');
  //Start download
  while (proceedAssetCount < assetCount) {
    const currentGroup = assetOperations.slice(proceedAssetCount, proceedAssetCount + download_concurrency);
    console.log('Downloading ' + proceedAssetCount + '->' + (proceedAssetCount + download_concurrency) + ' /' + assetCount + ' ' + ((proceedAssetCount * 100) / assetCount) + '%...');
    await Promise.all(currentGroup.map(operation => operation().catch(err => {
      assetErrors.push(err);
      console.raw.error(err);
    }))).catch(err => console.raw.error(err));
    //proceedAssetCount += currentGroup.length;
  }
  console.log('All asset downloaded');
  if (assetErrors.length > 0) console.raw.log('Following errors occurred during assets install (can be ignored):  ', assetErrors);
  return { state: LaunchTaskState.finished };

}

async function DownloadLibs(version: GameVersion, versionData: ResolvedVersion, dir: string, sendProgress: progressCallbackFunction, onError: (e: any) => void, options?: {
  force: boolean
}): Promise<SubLaunchTaskCallback> {
  sendProgress(undefined, 'Checking Minecraft Libs...');
  const download_concurrency = 3;
  if (!fs.existsSync(path.join(dir, 'libraries'))) fs.mkdirSync(path.join(dir, 'libraries'));
  const libsErrors: any[] = [];
  let proceedLibsCount = 0;
  //Filter
  let libsList = versionData.libraries;
  if (options === undefined || !options.force) {
    let newList: ResolvedLibrary[] = [];
    const libReport = await diagnoseLibraries(versionData, new MinecraftFolder(dir));
    libReport.forEach(report => newList.push(report.library));
    libsList = newList;
  }
  const libsCount = libsList.length;
  console.log('Parsing libs...');
  //normal libs
  const libsOperations: (() => Promise<void>)[] = Object.values(libsList).map((lib, libIndex) => {
    return () => {
      return new Promise<void>(async (resolve, reject) => {
        try {
          const task = new InstallLibraryTask(lib, new MinecraftFolder(dir), { skipPrevalidate: options && options.force });
          // @ts-ignore
          await task.startAndWait();
          sendProgress(((proceedLibsCount * 100) / libsCount), 'Installing Minecraft libs...', proceedLibsCount + '/' + (libsCount - 1));
          proceedLibsCount++;
          console.log(`Downloaded lib [${libIndex}]: ${Math.floor((proceedLibsCount * 100) / libsCount)}%`);
          resolve();

        } catch (e) {
          //console.raw.error(libIndex + ':  ', e);
          libsErrors.push({ id: libIndex, error: e });
          reject(e);
        }
      });
    };
  });
  while (proceedLibsCount < libsCount) {
    const currentGroup = libsOperations.slice(proceedLibsCount, proceedLibsCount + download_concurrency);
    console.log('Downloading ' + proceedLibsCount + '->' + (proceedLibsCount + download_concurrency) + ' /' + (libsCount - 1) + ' ' + ((proceedLibsCount * 100) / libsCount) + '%...');
    await Promise.all(currentGroup.map(operation => operation().catch(err => {
      libsErrors.push(err);
      console.raw.error(err);
    }))).catch(err => console.raw.error(err));
    //proceedAssetCount += currentGroup.length;
  }


  //
  console.log('All libs downloaded');
  if (libsErrors.length > 0) console.raw.log('Following errors occurred during libs install (can be ignored):  ', libsErrors);
  return { state: LaunchTaskState.finished };
}


async function parseVersionData(versionId: string) {
  const JSON_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
  const response = await axios.get(JSON_URL, { responseType: 'json' });
  const versionList: JsonVersionList = response.data;
  const version = versionList.versions.find((v: {
    id: string
  }) => v.id === versionId);
  if (version === undefined) throw new Error('Version: ' + versionId + ' is not found'); else return (await axios.get(version.url, { responseType: 'json' })).data as ResolvedVersion;
}

export async function DiagnoseVersion(version: GameVersion, path: string) {
  const minecraftFolder = new MinecraftFolder(path);
  let mainReport = await diagnose(version.id, minecraftFolder);
  mainReport.issues = mainReport.issues.filter(issue => {
    return issue.role !== 'assetIndex';
  });
  return mainReport;
}

export async function VerifyVersionFile(version: GameVersion, path: string): Promise<boolean> {
  if (!existsSync(path)) {
    console.raw.error('path don\' exist');
    return false;
  }
  console.log(`Diagnosing ${version.gameType} ${version.id}`);
  const { issues } = await DiagnoseVersion(version, path);
  return issues.length === 0;
  //report can be analysed [https://github.com/Voxelum/minecraft-launcher-core-node/tree/master/packages/core#diagnose]
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

      if (stats.isDirectory()) stack.push(filePath); else if (file === targetFileName) return filePath;
    }
  }
  return undefined;
}

export function deleteFolderRecursive(path: string, deleteParent?: boolean) {
  deleteParent = deleteParent || true;
  if (fs.existsSync(path)) {
    try {
      fs.readdirSync(path).forEach(function(file) {
        const curPath = join(path, file);
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          try {
            fs.unlinkSync(curPath);
          } catch (e) {
            console.warn('Skipped file: ' + curPath, e);
          }
        }
      });
      if (deleteParent) {
        try {
          fs.rmdirSync(path);
        } catch (e) {
          console.warn('Skipped folder: ' + path, e);
        }
      }
    } catch (e) {
      console.log('');
    }
  }
}

/****/
export function getLocationRoot(): string {
  const storageRes: string | null | undefined = getDataStorage().get('saved.rootPath');
  if (storageRes !== undefined && storageRes !== null) {
    if (!fs.existsSync(storageRes)) fs.mkdirSync(storageRes);
    return storageRes;
  } else return setLocalLocationRoot(getDefaultRootPath());
}

export function getRuntimePath(): string {
  const path = Path.join(getLocationRoot(), '/runtime/');
  if (!fs.existsSync(path)) {
    console.log('Creating runtime folder');
    fs.mkdirSync(path);
  }
  return path;
}

export function getInstancePath(): string {
  const path = Path.join(getLocationRoot(), '/instances/');
  if (!fs.existsSync(path)) {
    console.log('Creating instance folder');
    fs.mkdirSync(path);
  }
  return path;
}

export function getPermaPath(): string {
  const path = Path.join(getLocationRoot(), '/permanent/');
  if (!fs.existsSync(path)) {
    console.log('Creating permanent folder');
    fs.mkdirSync(path);
  }
  return path;
}

export function getDefaultRootPath(): string {
  return getAppDataPath() + '\\.minecraft';
}

function setLocalLocationRoot(path: string) {
  getDataStorage().set('saved.rootPath', path);
  return path;
}
