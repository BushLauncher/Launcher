import { ParseGameFile, ParseJava, VerifyAccount } from './PreLaunchEngine';
import { GameType, GameVersion, getVersion, PreLaunchRunnableProcess } from './public/GameDataPublic';

export const getLaunchInternal: () => PreLaunchRunnableProcess = () => {
  const v: GameVersion = getVersion(GameType.VANILLA, '1.19.4');
  return <PreLaunchRunnableProcess>{
    version: v,
    resolved: true,
    internal: true,
    launch: true,
    actions: [
      new VerifyAccount({ id: 'VerifyAccount' }),
      new ParseJava({ id: 'ParseJava' }),
      new ParseGameFile({ id: 'ParseGameFile', params: { version: v } })
    ]
  };
};
