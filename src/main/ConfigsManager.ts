import { GameType } from '../types/Versions';
import { Configuration, ConfigurationLocalBackground, ConfigurationLocalIcon } from '../types/Configuration';
import { getConfigManager } from './main';
import { Storage } from './DataManager';

export const defaultConfigData: Configuration[] = [{
  name: 'Test configuration',
  id: 'test_config',
  description: 'Lorem ipsum dolor sit amet',
  isolated: false,
  process: { process: [], allowCustomOperations: false, id: 'Test configuration process' },
  versions: [{ id: '1.20.2', gameType: GameType.VANILLA }],
  icon: { type: 'Local', data: ConfigurationLocalIcon.dirt },
  backgroundImage: { type: 'Local', data: ConfigurationLocalBackground.underwater }
}, {
  name: 'Test configuration 2',
  id: 'test_config_2',
  description: 'Lorem ipsum dolor sit amet',
  isolated: false,
  process: { process: [], allowCustomOperations: false, id: 'Test configuration process' },
  versions: [{ id: '1.20.2', gameType: GameType.VANILLA }, { id: '1.16.4', gameType: GameType.VANILLA }],
  icon: { type: 'Local', data: ConfigurationLocalIcon.dirt },
  backgroundImage: { type: 'Local', data: ConfigurationLocalBackground.cave }
}];

export class ConfigurationManager {
  public readonly storage!: Storage;
  private localList!: Configuration[];

  constructor() {
    //Init storage
    this.storage = new Storage('configs', { configs: defaultConfigData });
    this.load();
  }

  public getAll(): Configuration[] {
    return this.localList;
  }

  public get(id: string) {
    return this.localList[this.index(id)];
  }

  public add(config: Configuration) {
    this.localList.push(config);
    this.save();
  }

  public remove(id: string) {
    this.localList.slice(this.index(id), 1);
    this.save();
  }

  private index(id: string): number {
    const result = this.localList.findIndex(c => c.id === id);
    if (result === -1) throw new Error('Cannot find configuration: ' + id);
    else return result;
  }

  private load() {
    const response: Configuration[] | undefined = this.storage.get('configs');
    if (response === undefined) {
      this.localList = [];
      console.log('No configs found in storage');
    } else this.localList = response;
  }

  private save(particularData?: Configuration[]) {
    this.storage.set('configs', particularData || this.localList);
  }
}
