import { GameType, getVersion, isSupported, Version } from './public/GameData';
import { MinecraftVersion, MinecraftVersionList } from '@xmcl/installer';
import { readdirSync } from 'fs';
import path from 'path';
import { MinecraftVersionSorter } from './utils';

const { getVersionList } = require('@xmcl/installer');

const getAppDataPath = require('appdata-path');
const locationRoot = getAppDataPath() + '\\.minecraft';

export function GetVersionList(gameType: GameType) {
  switch (gameType) {
    case GameType.VANILLA: {
      return new Promise((resolve, reject) => {
        //get all folder in local appdata
        getVersionList()
          .then((response: MinecraftVersionList) => {
            //reindexing version list to get just the release
            let versionList: Version[] = [];
            Array.from(response.versions).forEach(
              (version: MinecraftVersion) => {
                if (
                  version.type === 'release' &&
                  isSupported(gameType, version.id)
                ) {
                  let newVersion: Version = {
                    id: version.id,
                    gameType: gameType,
                    xmclData: version,
                    installed: isInstalled(version.id),
                  };
                  versionList.push(newVersion);
                }
              }
            );
            resolve(versionList);
          })
          .catch((err: any) => {
            console.error(err);
            reject(err);
          });
      });
    }
    default:
      console.error(
        '[getVersionList]: The gameType: ' + gameType + ' is not implemented'
      );
  }
}
export function GetLocalVersionList(gameType: GameType) {
  switch (gameType) {
    case GameType.VANILLA: {
      return new Promise((resolve, reject) => {
        const localURL = path.join(locationRoot, 'versions');
        const regex = /^\b\d+\.\d+(\.\d+)?\b$/g;
        //get all folder in local appdata
        const foldersToProcess = readdirSync(localURL);
        let minecraftVersionsList: Version[];

        minecraftVersionsList = foldersToProcess
          .filter(
            (folder) => regex.test(folder) && isSupported(gameType, folder)
          )
          .sort(MinecraftVersionSorter)
          .reverse()
          .map((folder): Version => {
            const version: Version = getVersion(gameType, folder);
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

export function isInstalled(versionName: string): boolean {
  const localURL = locationRoot + '\\versions\\';
  const folderList = readdirSync(localURL);
  return folderList.includes(versionName);
}
