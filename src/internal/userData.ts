import { getDefaultGameType, getDefaultVersion, VersionData } from './public/GameData';
import { app } from 'electron';
import fs, { readFileSync, writeFileSync } from 'fs';
import { userDataStorage } from '../main/main';
import { Xbox } from 'msmc';
import { Theme } from './public/ThemePublic';

const path = require('path');
const userPath = app.getPath('userData');
const prefix: string = '[UserData]: ';


export function loadData() {
  //console.log(prefix + 'Retrieving data from local storage...');
  const res: VersionData | undefined = userDataStorage.get('version.selected');
  if (res != undefined) SelectVersion(res);
  //console.log(prefix + '--------');
}

export function SelectVersion(version: VersionData): void {
  userDataStorage.update('version.selected', version);
  console.log(`Selecting for: [${version.gameType.toString().toLowerCase()}]: ${version.id}`);
}

interface InterfaceData {
  selectedTab: string;
  theme: Theme;
  isMenuCollapsed: boolean;
}

interface AuthData {
  accountList: Xbox[];
  selectedAccount: number | null;
}

interface SavedData {
  javaPath: string | null;
  rootPath: string | null;
}

export interface defaultData {
  interface: InterfaceData;
  version: {
    selected: VersionData;
  };
  auth: AuthData;
  saved: SavedData;
}

export function createDefaultData(): defaultData {
  return {
    saved: {
      javaPath: null,
      rootPath: null
    },
    auth: {
      accountList: [],
      selectedAccount: null
    },
    version: { selected: getDefaultVersion(getDefaultGameType) },
    interface: {
      selectedTab: 'vanilla',
      theme: Theme.Dark,
      isMenuCollapsed: true
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
      return true;
    } catch (err) {
      console.error(err);
      return false;
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
    //console.log('Saving All data');
    writeFileSync(this.storageFilePath, JSON.stringify(customData ? customData : this.data));
  }
}

//TODO: Add an encryption system
