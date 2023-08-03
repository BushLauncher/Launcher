import { GameType, GameVersion, getDefaultGameType, getDefaultVersion } from '../../public/GameDataPublic';
import { getVersionList as getXMCLVersionList, MinecraftVersionList } from '@xmcl/installer';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { SortMinecraftVersion } from './Utils';
import { userDataStorage } from '../main';
import { getLocationRoot } from './Core';
import { net } from 'electron';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';


const console = new ConsoleManager('VersionManager', ProcessType.Internal);

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
        if (typeof versionList !== 'object') throw new Error('Minecraft version list is void ');
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

export interface GroupedGameVersions {
  group: true,
  parent: GameVersion;
  children: GameVersion[]
};

export function groupMinecraftVersions(versionsList: GameVersion[]): (GameVersion | GroupedGameVersions)[] {
  versionsList.sort((a, b) => {
    const aParts = a.id.split('.').map(Number);
    const bParts = b.id.split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aValue = aParts[i] || 0;
      const bValue = bParts[i] || 0;

      if (aValue !== bValue) {
        return bValue - aValue;
      }
    }

    return 0;
  });

  const groups: GroupedGameVersions[] = [];
  let currentGroup: GroupedGameVersions = {
    parent: versionsList[0],
    children: [],
    group: true
  };

  for (let i = 1; i < versionsList.length; i++) {
    const version = versionsList[i];
    const hasCommonParent = hasCommonParentVersion(version, currentGroup.parent);

    if (hasCommonParent) {
      currentGroup.children.push(version);
    } else {
      groups.push(currentGroup);
      currentGroup = {
        parent: version,
        children: [],
        group: true
      };
    }
  }

  groups.push(currentGroup);
  return groups.map((group) => group.children.length === 0 ? group.parent : group);
}

function hasCommonParentVersion(version: GameVersion, parent: GameVersion): boolean {
  const versionParts = version.id.split('.').map(Number);
  const parentParts = parent.id.split('.').map(Number);


  for (let i = 0; i < versionParts.length - 1; i++) {
    if (versionParts[i] !== parentParts[i]) {
      return false;
    }
  }

  return true;
}
