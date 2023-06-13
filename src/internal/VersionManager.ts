import {
  GameType,
  getDefaultGameType,
  getDefaultVersion,
  getVersion,
  isSupported,
  VersionData
} from './public/GameData';
import { MinecraftVersion } from '@xmcl/installer';
import { readdirSync } from 'fs';
import path from 'path';
import { MinecraftVersionSorter } from './Utils';
import { userDataStorage } from '../main/main';

const { getVersionList } = require('@xmcl/installer');

const getAppDataPath = require('appdata-path');
export const locationRoot = getAppDataPath() + '\\.minecraft';

export function getSelectedVersion(): VersionData | undefined {
  const storage: VersionData | undefined = userDataStorage.get('version.selected');
  return storage === undefined ? getDefaultVersion(getDefaultGameType) : storage;
}

export async function GetVersionList(gameType: GameType): Promise<VersionData[]> {
  switch (gameType) {
    case GameType.VANILLA: {
      let versionList: VersionData[] = [];
      //get all folder in local appdata
      await (await getVersionList().catch((err: any) => console.error(err)))
        .versions.forEach((version: MinecraftVersion) => {          //reindexing version list to get just the release
          if (version.type === 'release' && isSupported(gameType, version.id)) {
            let newVersion: VersionData = {
              id: version.id,
              gameType: gameType,
              installed: versionExist(version.id)
            };
            versionList.push(newVersion);
          }
        });
      return versionList;
    }
    default:
      console.error(`[getVersionList]: The gameType: ${gameType} is not implemented`);
      return [];
  }

}

export function GetLocalVersionList(gameType: GameType): VersionData[] {
  const localURL = path.join(locationRoot, 'versions');
  //console.log('Searching for local minecraft version in ' + localURL + '...');
  //TODO: make this function use Version.parse from @xmcl/installer
  switch (gameType) {
    case GameType.VANILLA: {
      const regex = /^\b\d+\.\d+(\.\d+)?\b$/g;
      //get all folder in local appdata
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
    default:
      console.error(`[getLocalVersionList]: The gameType: ${gameType} is not implemented`);
      return [];
  }
}

export function versionExist(versionName: string): boolean {
  const localURL = locationRoot + '\\versions\\';
  const folderList = readdirSync(localURL);
  return folderList.includes(versionName);
}
