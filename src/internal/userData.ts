import { defaultGameType, defaultVersion, Version } from './public/GameData';
import { app } from 'electron';
import fs, { readFileSync, writeFileSync } from 'fs';
import { userDataStorage } from '../main/main';
import { Xbox } from 'msmc';
import { Theme } from './public/ThemePublic';

const path = require('path');
const userPath = app.getPath('userData');
const prefix: string = '[UserData]: ';

let selected: Version | undefined = undefined;

export function getSelected(): Version {
  if (typeof selected === 'undefined') {
    return defaultVersion(defaultGameType);
  } else {
    return selected;
  }
}

export function loadData() {
  console.log(prefix + 'Retrieving data from local storage...');
  const res: Version | undefined = userDataStorage.get('version.selected');
  if (res != undefined) SelectVersion(res);
  console.log(prefix + '--------');
}

export function SelectVersion(version: Version) {
  selected = version;
  userDataStorage.update('version.selected', version);
  console.log(
    'Selecting for: [' +
    selected.gameType.toString().toLowerCase() +
    ']: ' +
    selected.id
  );
}

interface InterfaceData {
  selectedTab: string;
  theme: Theme;
}

interface AuthData {
  accountList: Xbox[];
  selectedAccount: number | null;
}

export interface defaultData {
  interface: InterfaceData;
  version: {
    selected: Version;
  };
  auth: AuthData;
}

export function createDefaultData(): defaultData {
  return {
    auth: {
      accountList: [],
      selectedAccount: null
    },
    version: { selected: defaultVersion(defaultGameType) },
    interface: {
      selectedTab: 'vanilla',
      theme: Theme.Dark
    }
  };
}

export class Storage {
  private data: Record<string, unknown> = {};
  private readonly storageFilePath: string;

  constructor(private fileName: string) {
    this.storageFilePath = path.join(userPath, fileName + '.json');
    this.loadData();
  }

  public DeleteFile(): boolean {
    try {
      fs.unlinkSync(this.storageFilePath);
      return true
    } catch (err) {
      console.error(err);
      return false
    }
  }

  get<T>(propertyPath: string): T | undefined {
    const [key, propertyObject] = this.findProperty(propertyPath);
    return propertyObject[key] as T;
  }

  set<T>(propertyPath: string, value: T): void {
    const [key, propertyObject] = this.findProperty(propertyPath);
    propertyObject[key] = value;
    this.saveData();
  }

  update<T>(propertyPath: string, value: T): void {
    const [key, propertyObject] = this.findProperty(propertyPath);
    propertyObject[key] = value;
    this.saveData();
  }

  remove(propertyPath: string): void {
    const [key, propertyObject] = this.findProperty(propertyPath);
    delete propertyObject[key];
    this.saveData();
  }

  private findProperty(
    propertyPath: string
  ): [string, Record<string, unknown>] {
    const properties = propertyPath.split('.');
    let propertyObject = this.data;
    for (let i = 0; i < properties.length - 1; i++) {
      const property = properties[i];
      propertyObject[property] = propertyObject[property] ?? {};
      propertyObject = propertyObject[property] as Record<string, unknown>;
    }
    const key = properties[properties.length - 1];
    return [key, propertyObject];
  }

  private loadData(): void {
    try {
      const data = JSON.parse(readFileSync(this.storageFilePath, 'utf8'));
      if (typeof data === 'object') {
        this.data = data;
      }
    } catch {
      console.log(prefix + 'Creating default configuration file...');
      this.saveData(createDefaultData());
    }
  }

  private saveData(customData?: any): void {
    console.log('Saving All data');
    writeFileSync(
      this.storageFilePath,
      JSON.stringify(customData ? customData : this.data)
    );
  }
}
