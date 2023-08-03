import { ParseAccount, ParseGameFile, ParseJava, ResolvedPreLaunchTask } from './PreLaunchEngine';
import { GameVersion } from '../../public/GameDataPublic';

export const getLaunchInternal: (version: GameVersion) => ResolvedPreLaunchTask[] = (version) => {
  return [
    new ParseJava({ task: 'ParseJava' }),
    new ParseGameFile({ task: 'ParseGameFile', params: { version: version } }),
    new ParseAccount({ task: 'ParseAccount' })
  ];
};
