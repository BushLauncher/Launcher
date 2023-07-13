import { GameType, GameVersion, getDefaultGameType, getDefaultVersion } from '../../public/GameDataPublic';
import { MinecraftVersion, MinecraftVersionList } from '@xmcl/installer';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { SortMinecraftVersion } from './Utils';
import { userDataStorage } from '../main';
import { getLocationRoot } from './Launcher';
import { net } from 'electron';

const { getVersionList: getXMCLVersionList } = require('@xmcl/installer');

export function getSelectedVersion(): GameVersion | undefined {
  const storageRes: GameVersion | undefined = userDataStorage.get('version.selected');
  return (storageRes === undefined) ? getDefaultVersion(getDefaultGameType) : storageRes;
}

export type getVersionMethode = 'network' | 'local' | 'auto';

export async function getAllVersionList(methode?: getVersionMethode): Promise<GameVersion[]> {
  if (methode === undefined) methode = 'auto';
  let res: GameVersion[] = [];
  for (const versionType of Object.values(GameType)) {
    if (net.isOnline() && (methode === 'auto' || methode === 'network')) res = res.concat(await getVersionList(versionType));
    else res = res.concat(getLocalVersionList(versionType));
  }
  return res;
}

export async function getVersionList(gameType: GameType): Promise<GameVersion[]> {
  return new Promise<GameVersion[]>(async (resolve, reject) => {
    switch (gameType) {
      case GameType.VANILLA: {
        let foundedList: GameVersion[] = [];
        const versionList = await getXMCLVersionList()
          .catch((err: any) => {
            console.log(err);
            reject('Cannot get minecraft version list' + err);
          });
        for (const version of versionList.versions) {
          //reindexing version list to get only releases
          if (version.type === 'release') {
            let newVersion: GameVersion = {
              id: version.id,
              gameType: gameType,
              installed: versionExist(version.id)
            };
            foundedList.push(newVersion);
          }
        }
        resolve(foundedList);
        break;
      }
      default:
        console.error(`[getVersionList]: The gameType: ${gameType} is not implemented`);
        resolve([]);
    }
  });
}

export function getLocalVersionList(gameType: GameType): GameVersion[] {
  const localURL = path.join(getLocationRoot(), 'versions');
  //TODO: make this function use Version.parse from @xmcl/installer
  switch (gameType) {
    case GameType.VANILLA: {
      const regex = /^\b\d+\.\d+(\.\d+)?\b$/g;
      //get all folder in local appdata
      if (!existsSync(localURL)) return [];
      const foldersToProcess = readdirSync(localURL);
      let minecraftVersionsList: GameVersion[];
      minecraftVersionsList = foldersToProcess
        .filter((folder) => regex.test(folder) && isSupported(gameType, folder)).sort(SortMinecraftVersion)
        .reverse()
        .map((folder): GameVersion => {
          const version: GameVersion = constructVersion(gameType, folder, true);
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
  const localURL = getLocationRoot() + '\\versions\\';
  if (existsSync(localURL)) return readdirSync(localURL).includes(versionName);
  else return false;
}


function constructVersion(gameType: GameType, id: string, installed?: boolean): GameVersion {
  return <GameVersion>{ gameType, id, installed };
}

async function isSupported(gameType: GameType, id: string) {
  const list: MinecraftVersionList = await getXMCLVersionList();
  switch (gameType) {
    case GameType.VANILLA:
      return list.versions.findIndex(version => version.id === id) !== -1;
    default:
      throw new Error('GameType: ' + gameType + ' is not implemented');
  }
}
