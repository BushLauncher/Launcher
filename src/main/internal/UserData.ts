import { GameVersion, getDefaultGameType, getDefaultVersion } from '../../public/GameDataPublic';
import { app, safeStorage } from 'electron';
import fs, { readFileSync, writeFileSync } from 'fs';
import { userDataStorage } from '../main';
import { Xbox } from 'msmc';
import { Themes } from '../../public/ThemePublic';
import { deleteFolderRecursive } from './FileManager';
import path from 'path';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';

const console = new ConsoleManager("UserData", ProcessType.Internal)

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
if (isDebug) app.setPath('userData', path.resolve(app.getPath('userData'), '../' + app.getName() + '-DevEnv'));
console.log(app.getPath('userData'));

export const tempDownloadDir = path.join(app.getPath('userData'), 'Download Cache\\');
export const javaPath = path.join(app.getPath('userData'), 'Local Java\\');
if (!fs.existsSync(javaPath)) fs.mkdirSync(javaPath);
if (!fs.existsSync(tempDownloadDir)) fs.mkdirSync(tempDownloadDir);

export function loadData() {
  const res: GameVersion | undefined = userDataStorage.get('version.selected');
  if (res != undefined) SelectVersion(res);
}

export function SelectVersion(version: GameVersion): void {
  userDataStorage.update('version.selected', version);
  console.log(`Selecting for: [${version.gameType.toString().toLowerCase()}]: ${version.id}`);
}

export function SetRootPath(path: string): boolean {
  if (fs.existsSync(path)) {
    userDataStorage.set('saved.rootPath', path);
    return true;
  } else return false;
}

interface InterfaceData {
  selectedTab: string;
  theme: Themes;
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
    selected: GameVersion;
  };
  auth: AuthData;
  saved: SavedData;
}

export function createDefaultData(): defaultData {
  return {
    saved: {
      javaPath: null, rootPath: null
    }, auth: {
      accountList: [], selectedAccount: null
    }, version: { selected: getDefaultVersion(getDefaultGameType) }, interface: {
      selectedTab: 'vanilla', theme: Themes.Dark, isMenuCollapsed: true
    }
  };
}

export class Storage {
  private data: Record<string, unknown> = {};
  private readonly storageFilePath: string;
  private readonly devStorageFilePath: string;

  constructor(private fileName: string) {
    this.storageFilePath = path.join(app.getPath('userData'), fileName + '.json');
    this.devStorageFilePath = path.join(app.getPath('userData'), fileName + '-dev' + '.json');
    app.whenReady().then(() => {
      this.loadData();
    });
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

  private findProperty(propertyPath: string): [string, Record<string, unknown>] {
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
      const encryptedData: Buffer = Buffer.from(readFileSync(this.storageFilePath));
      this.data = JSON.parse(safeStorage.decryptString(encryptedData));
    } catch {
      console.log('Creating default configuration file...');
      this.saveData(createDefaultData());
    }
  }

  private saveData(customData?: Object): void {
    writeFileSync(this.storageFilePath, safeStorage.encryptString(JSON.stringify(customData ? customData : this.data)));
    if(isDebug) writeFileSync(this.devStorageFilePath, JSON.stringify(customData ? customData : this.data));
  }


}

export function CleanUpCatch() {
  deleteFolderRecursive(tempDownloadDir);
}


//TODO: Add an encryption system
