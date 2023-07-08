import { ParseGameFile, ParseJava, ResolvedPreLaunchTask, ParseAccount } from './PreLaunchEngine';
import { GameVersion } from '../../public/GameDataPublic';

export const getLaunchInternal: (version: GameVersion) => ResolvedPreLaunchTask[] = (version) => {
  return [
    new ParseAccount({ id: 'ParseAccount' }),
    new ParseJava({ id: 'ParseJava' }),
    new ParseGameFile({ id: 'ParseGameFile', params: { version: version } })
  ];
};
