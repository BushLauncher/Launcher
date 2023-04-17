import { MinecraftVersion } from '@xmcl/installer';
/*CAN BE LOADED FROM RENDERER PROCESS
 * DONT IMPORT FS, PATH, ELECTRON, etc...*/
export enum GameType {
  VANILLA,
}
export type Version = {
  id: string;
  gameType: GameType;
  xmclData?: MinecraftVersion;
  installed?: boolean;
};
interface defaultGameLink {
  gameType: GameType;
  version: Version;
}
export const defaultGameType: GameType = GameType.VANILLA;
export const defaultVersion = (gameType: GameType) => {
  return supportedVersion[
    supportedVersion.findIndex((v) => v.gameType == gameType)
  ];
};
export const supportedVersion: Array<Version> = [
  { id: '1.19.4', gameType: GameType.VANILLA },
  { id: '1.18.2', gameType: GameType.VANILLA },
  { id: '1.16.5', gameType: GameType.VANILLA },
  { id: '1.14.4', gameType: GameType.VANILLA },
  { id: '1.13.2', gameType: GameType.VANILLA },
  { id: '1.12.2', gameType: GameType.VANILLA },
  { id: '1.18.9', gameType: GameType.VANILLA },
  { id: '1.7.10', gameType: GameType.VANILLA },
];

export const isSupported = (gameType: GameType, id: string): boolean => {
  for (const version of supportedVersion) {
    if (version.id === id && version.gameType === gameType) {
      return true;
    }
  }
  return false;
};
export const getVersion = (gameType: GameType, id: string): Version => {
  if (isSupported(gameType, id)) {
    for (const version of supportedVersion) {
      if (version.id === id && version.gameType === gameType) return version;
    }
    throw new Error(
      'Cannot get minecraft version: ' + id + ' in GameType: ' + gameType + '.'
    );
  } else {
    throw new Error(
      'Version ' + id + "isn't unsupported, \n maybe is the wrong gameType"
    );
  }
};
/*functions to assure JS Connexion*/
export function isGameType(element: any): boolean {
  return element in GameType;
}

export function concatXmclVersion(
  xmclVersion: MinecraftVersion,
  version: Version
): Version {
  version.xmclData = xmclVersion;
  return version;
}
