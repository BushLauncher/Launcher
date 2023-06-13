import { LaunchRunnableProcess, ParseGameFile, ParseJava, VerifyAccount } from './LaunchEngine';
import { GameType, getVersion, VersionData } from './public/GameData';

export const getLaunchInternal: () => LaunchRunnableProcess = () => {
  const v: VersionData = getVersion(GameType.VANILLA, '1.19.4');
  return <LaunchRunnableProcess>{
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
