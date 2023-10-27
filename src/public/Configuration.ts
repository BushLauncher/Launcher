import { GameType, GameVersion, RawLaunchProcess } from './GameDataPublic';


type ConfigurationRessourceType = 'Local' | 'Link'

export enum ConfigurationLocalIcon {
  dirt = "dirt"
}

export type ConfigurationIcon = {
  type: ConfigurationRessourceType,
  data: string | ConfigurationLocalIcon
};

export enum ConfigurationLocalBackground {
  vanilla = 'vanilla',
  underwater = 'underwater',
  cave = 'cave'
}

export type ConfigurationBackground = {
  type: ConfigurationRessourceType,
  data: string | ConfigurationLocalBackground
};

/********************************/
export interface Configuration {
  id: string
  name: string,
  description: string,
  icon: ConfigurationIcon,
  backgroundImage: ConfigurationBackground,
  isolated: boolean,
  process: Omit<RawLaunchProcess, 'version'>,
  versions: GameVersion[] | GameVersion
}

/**
 * Possible given information by analysing process of configuration
 * use getConfigurationData()
 */
export interface ConfigurationInfos {
  modded: boolean,
  modList: any[]
  type: GameType
}

/*************/
export function getConfigurationInfos(configuration: Configuration): ConfigurationInfos {
  const type = Array.isArray(configuration.versions) ? configuration.versions[0].gameType : configuration.versions.gameType;
  return {
    type: type,
    modded: type !== GameType.VANILLA,
    modList: ['UNIMPLEMENTED']
  };
}
