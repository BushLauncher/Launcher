import {
  GameType,
  getDefaultGameType,
  getDefaultVersion,
  getVersion,
  isSupported,
  supportedVersion,
  VersionData
} from './public/GameData';
import { MinecraftVersion } from '@xmcl/installer';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { MinecraftVersionSorter } from './Utils';
import { userDataStorage } from '../main/main';
import { getLocationRoot } from './Launcher';
import { net } from 'electron';

const { getVersionList } = require('@xmcl/installer');

const getAppDataPath = require('appdata-path');

export function getSelectedVersion(): VersionData | undefined {
  const storage: VersionData | undefined = userDataStorage.get('version.selected');
  return storage === undefined ? getDefaultVersion(getDefaultGameType) : storage;
}

export type getVersionMethode = 'network' | 'local' | 'auto';

export async function GetAllVersionList(methode?: getVersionMethode): Promise<VersionData[]> {
  if (methode === undefined) methode = 'auto';
  let res: VersionData[] = [];
  for (const versionType of Object.values(GameType)) {
    if (net.isOnline() && (methode === 'auto' || methode === 'network')) res = res.concat(await GetVersionList(versionType));
    else res = res.concat(GetLocalVersionList(versionType));
  }
  return res;
}

export async function GetVersionList(gameType: GameType): Promise<VersionData[]> {
  return new Promise<VersionData[]>(async (resolve, reject) => {
    switch (gameType) {
      case GameType.VANILLA: {
        let foundedList: VersionData[] = [];
        const versionList = await getVersionList().catch((err: any) => {
          console.log(err);
          reject('Cannot get minecraft version list' + err);
        });
        versionList.versions.forEach((version: MinecraftVersion) => {
          //reindexing version list to get just the release
          if (version.type === 'release' && isSupported(gameType, version.id)) {
            let newVersion: VersionData = {
              id: version.id,
              gameType: gameType,
              installed: versionExist(version.id)
            };
            foundedList.push(newVersion);
          }
        });
        resolve(foundedList);
        break;
      }
      case GameType.TEST: {
        resolve([{
          id: supportedVersion[supportedVersion.length - 1].id,
          gameType: gameType,
          installed: versionExist(supportedVersion[supportedVersion.length - 1].id)
        }]);
        break;
      }
      default:
        console.error(`[getVersionList]: The gameType: ${gameType} is not implemented`);
        resolve([]);
    }
  });
}

export function GetLocalVersionList(gameType: GameType): VersionData[] {
  const localURL = path.join(getLocationRoot(), 'versions');
  //console.log('Searching for local minecraft version in ' + localURL + '...');
  //TODO: make this function use Version.parse from @xmcl/installer
  switch (gameType) {
    case GameType.VANILLA: {
      const regex = /^\b\d+\.\d+(\.\d+)?\b$/g;
      //get all folder in local appdata
      if (!existsSync(localURL)) return [];
      const foldersToProcess = readdirSync(localURL);
      let minecraftVersionsList: VersionData[];
      minecraftVersionsList = foldersToProcess
        .filter((folder) => regex.test(folder) && isSupported(gameType, folder)).sort(MinecraftVersionSorter)
        .reverse()
        .map((folder): VersionData => {
          const version: VersionData = getVersion(gameType, folder);
          version.installed = true;
          /*got from locals files, so version folder exist*/
          return version;
        });
      return minecraftVersionsList;
    }
    case GameType.TEST: {
      return [{ id: 'test', gameType: GameType.TEST, installed: true }];
    }
    default:
      console.error(`[getLocalVersionList]: The gameType: ${gameType} is not implemented`);
      return [];
  }
}

export function versionExist(versionName: string): boolean {
  const localURL = getLocationRoot() + '\\versions\\';
  if (existsSync(localURL)) return readdirSync(localURL).includes(versionName);
  else return false;
}
