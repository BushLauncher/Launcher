import { ParseAccount, ParseGameFile, ParseJava, ResolvedPreLaunchTask } from './PreLaunchEngine';
import { GameVersion } from '../../public/GameDataPublic';

export const getLaunchInternal: (version: GameVersion) => ResolvedPreLaunchTask[] = (version) => {
  return [
    new ParseJava({ id: 'ParseJava' }),
    new ParseGameFile({ id: 'ParseGameFile', params: { version: version } }),
    new ParseAccount({ id: 'ParseAccount' })
  ];
};
