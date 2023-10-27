import { GameVersion } from '../types/Versions';
import { app, safeStorage } from 'electron';
import fs, { readFileSync, writeFileSync } from 'fs';
import { userDataStorage } from './main';
import { deleteFolderRecursive } from './FileManager';
import path from 'path';
import ConsoleManager, { ProcessType } from '../global/ConsoleManager';
import { ConfigsStorage } from './ConfigsManager';

const console = new ConsoleManager('UserData', ProcessType.Internal);

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
if (isDebug) app.setPath('userData', path.resolve(app.getPath('userData'), '../' + app.getName() + '-DevEnv'));
console.log(app.getPath('userData'));

export const tempDownloadDir = path.join(app.getPath('userData'), 'Download Cache\\');
export const javaPath = path.join(app.getPath('userData'), 'Local Java\\');
if (!fs.existsSync(javaPath)) fs.mkdirSync(javaPath);
if (!fs.existsSync(tempDownloadDir)) fs.mkdirSync(tempDownloadDir);

export function loadData() {
}

export function SelectVersion(version: GameVersion, configurationId: string): void {
  //find index by confId
  const list: { key: string, selected: GameVersion }[] | undefined = userDataStorage.get('version.selected');
  if (list !== undefined) {
    const index = list.findIndex(v=>v.key === configurationId);
    if(index === -1) console.raw.error("Cannot find " + configurationId + "in selected list")
    userDataStorage.updateArray('version.selected', index, version);
    console.log(`Selecting for${configurationId}: [${version.gameType.toString().toLowerCase()}]: ${version.id}`);
  }
}

export function SetRootPath(path: string): boolean {
  if (fs.existsSync(path)) {
    userDataStorage.set('saved.rootPath', path);
    return true;
  } else return false;
}

export class Storage {
  private readonly defaultData!: object;
  private data: Record<string, unknown> = {};
  private readonly storageFilePath: string;
  private readonly devStorageFilePath: string;

  constructor(fileName: string, defaultData: object) {
    this.storageFilePath = path.join(app.getPath('userData'), fileName + '.json');
    this.devStorageFilePath = path.join(app.getPath('userData'), fileName + '-dev' + '.json');
    this.defaultData = defaultData;
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

  addToArray<T>(arrayPath: string, value: T): void {
    const [key, propertyObject] = this.findProperty(arrayPath);
    if (Array.isArray(propertyObject[key])) {
      // @ts-ignore
      propertyObject[key] = [value, ...propertyObject[key]];
      this.saveData();
    } else console.raw.error(arrayPath + ' is not an array');
  }

  removeFromArray<T>(arrayPath: string, index: number): void {
    const [key, propertyObject] = this.findProperty(arrayPath);
    if (Array.isArray(propertyObject[key])) {
      // @ts-ignore
      propertyObject[key].splice(index, 1);
      this.saveData();
    } else console.raw.error(arrayPath + ' is not an array');
  }

  updateArray<T>(arrayPath: string, index: number, value: T) {
    const [key, propertyObject] = this.findProperty(arrayPath);
    if (Array.isArray(propertyObject[key])) {
      // @ts-ignore
      propertyObject[key][index] = value;
      this.saveData();
    } else console.raw.error(arrayPath + ' is not an array');
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
      this.saveData(this.defaultData);
      this.loadData();
    }
  }

  private saveData(customData?: Object): void {
    writeFileSync(this.storageFilePath, safeStorage.encryptString(JSON.stringify(customData ? customData : this.data)));
    if (isDebug) writeFileSync(this.devStorageFilePath, JSON.stringify(customData ? customData : this.data));
  }


}

export function CleanUpCatch() {
  deleteFolderRecursive(tempDownloadDir);
}


//TODO: Add an encryption system
