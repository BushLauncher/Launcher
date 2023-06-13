import { GameType, getVersion, isSupported, VersionData } from './public/GameData';
import { MinecraftVersion, MinecraftVersionList } from '@xmcl/installer';
import { readdirSync } from 'fs';
import path from 'path';
import { MinecraftVersionSorter } from './utils';

const { getVersionList } = require('@xmcl/installer');

const getAppDataPath = require('appdata-path');
export const locationRoot = getAppDataPath() + '\\.minecraft';

export function GetVersionList(gameType: GameType): Promise<VersionData[]> | undefined {
  switch (gameType) {
    case GameType.VANILLA: {
      return new Promise((resolve, reject) => {
        //get all folder in local appdata
        getVersionList()
          .then((response: MinecraftVersionList) => {
            //reindexing version list to get just the release
            let versionList: VersionData[] = [];
            Array.from(response.versions).forEach(
              (version: MinecraftVersion) => {
                if (
                  version.type === 'release' &&
                  isSupported(gameType, version.id)
                ) {
                  let newVersion: VersionData = {
                    id: version.id,
                    gameType: gameType,
                    installed: versionExist(version.id)
                  };
                  versionList.push(newVersion);
                }
              }
            );
            resolve(versionList);
          })
          .catch((err: any) => {
            console.error(err);
          });
      });
    }
    default:
      console.error(
        '[getVersionList]: The gameType: ' + gameType + ' is not implemented'
      );
  }
}

export function GetLocalVersionList(gameType: GameType): Promise<VersionData[]> | undefined {
  //TODO: make this function use Version.parse from @xmcl/installer
  switch (gameType) {
    case GameType.VANILLA: {
      return new Promise((resolve, reject) => {
        const localURL = path.join(locationRoot, 'versions');
        const regex = /^\b\d+\.\d+(\.\d+)?\b$/g;
        //get all folder in local appdata
        const foldersToProcess = readdirSync(localURL);
        let minecraftVersionsList: VersionData[];

        minecraftVersionsList = foldersToProcess
          .filter(
            (folder) => regex.test(folder) && isSupported(gameType, folder)
          )
          .sort(MinecraftVersionSorter)
          .reverse()
          .map((folder): VersionData => {
            const version: VersionData = getVersion(gameType, folder);
            version.installed = true;
            /*got from locals files, so version folder exist*/
            return version;
          });
        resolve(minecraftVersionsList);
      });
    }
    default:
      console.error(
        '[getLocalVersionList]: The gameType: ' +
        gameType +
        ' is not implemented'
      );
  }
}

export function versionExist(versionName: string): boolean {
  const localURL = locationRoot + '\\versions\\';
  const folderList = readdirSync(localURL);
  return folderList.includes(versionName);
}
