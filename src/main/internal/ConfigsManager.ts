import { Storage } from './DataManager';
import { GameType } from '../../public/GameDataPublic';
import { Configuration, ConfigurationLocalBackground, ConfigurationLocalIcon } from '../../public/Configuration';

const defaultData: Configuration = {
  name: 'Test configuration',
  id: 'test_config',
  description: 'Lorem ipsum dolor sit amet',
  isolated: false,
  process: { process: [], allowCustomOperations: false, id: 'Test configuration process' },
  versions: [{ id: '1.20.2', gameType: GameType.VANILLA }],
  icon: {type: 'Local', data: ConfigurationLocalIcon.dirt},
  backgroundImage: {type: 'Local', data: ConfigurationLocalBackground.underwater}
};
const Data: Configuration = {
  name: 'Test configuration 2',
  id: 'test_config_2',
  description: 'Lorem ipsum dolor sit amet',
  isolated: false,
  process: { process: [], allowCustomOperations: false, id: 'Test configuration process' },
  versions: [{ id: '1.20.2', gameType: GameType.VANILLA }, { id: '1.16.4', gameType: GameType.VANILLA }],
  icon: {type: 'Local', data: ConfigurationLocalIcon.dirt},
  backgroundImage: {type: 'Local', data: ConfigurationLocalBackground.cave}
};


export const ConfigsStorage = new Storage('configs', { configs: [defaultData, Data] });

export function getConfigurations(): Configuration[] {
  const data: Configuration[] | undefined = ConfigsStorage.get('configs');
  return data || [];
}

export function AddConfiguration(configuration: Configuration) {
  ConfigsStorage.addToArray('configs', configuration);
}

export function RemoveConfiguration(id: string) {
  const index = getConfigurations().findIndex(config => config.id === id);
  if (index === -1) console.error('Cannot find configuration \'' + id + '\'');
  else ConfigsStorage.removeFromArray('configs', index);
}

export function getConfiguration(id: string): Configuration {
  const res = getConfigurations().find(c => c.id === id);
  if (res === undefined) throw new Error('Cannot find configuration ' + id);
  else return res;
}
