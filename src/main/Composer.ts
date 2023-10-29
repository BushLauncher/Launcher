import fs from 'fs';
import ConsoleManager, { ProcessType } from '../global/ConsoleManager';
import { CallbackType, ExitedCallback, ExitedReason } from '../types/Versions';
import path from 'path';
import { deleteFolderRecursive, getPermaPath, getRuntimePath } from './FileManager';
import { ChildProcess } from 'child_process';
import { rimraf } from 'rimraf';

/**
 * @param path instance folder path
 */
export interface RunnableParam {
  id: string;
  path: string;
  additionalPermanentFile?: FileOrFolder[];
}

interface FileOrFolder {
  /**
   * Relative path starting with "./"
   */
  path: string;
  destPath?: string;
}

const defaultPermanentFile: FileOrFolder[] = [
  { path: './options.txt' },
  { path: './saves' }
];

export class Runtime {
  readonly instanceFolder!: string;
  private readonly console: ConsoleManager;
  private readonly _runPath!: string;
  private readonly permanentFileList!: FileOrFolder[];
  private process?: ChildProcess;

  constructor(param: RunnableParam) {
    this.console = new ConsoleManager('Composer:' + param.id, ProcessType.Internal);
    this._runPath = path.join(getRuntimePath(), '/' + param.id);
    this.instanceFolder = param.path;
    this.permanentFileList = defaultPermanentFile.concat(param.additionalPermanentFile || []);
    console.log('Running in: ' + this._runPath);
  }

  get runPath(): string {
    return this._runPath;
  }

  public setProcess(process: ChildProcess) {
    this.process = process;
  }

  killProcess() {
    return this.process !== undefined && this.process.kill();
  }

  public Resolve() {

  }

  public async Compose(): Promise<void | ExitedCallback> {
    return new Promise(async (resolve, reject) => {
      this.console.warn('Composing...');
      // noinspection SpellCheckingInspection
      const rpath = this._runPath;
      // noinspection SpellCheckingInspection
      const ipath = this.instanceFolder;
      //Create folder
      if (!fs.existsSync(rpath)) {
        console.log('Creating folder...');
        fs.mkdirSync(rpath);
      } else {
        deleteFolderRecursive(rpath, false);
      }

      //Verify
      if (!fs.existsSync(rpath)) {
        resolve(<ExitedCallback>{
          type: CallbackType.Exited,
          return: { reason: ExitedReason.Error, display: 'Runtime folder cannot be find' }
        });
        return;
      }
      if (!fs.existsSync(ipath)) {
        resolve(<ExitedCallback>{
          type: CallbackType.Exited,
          return: { reason: ExitedReason.Error, display: 'instance folder cannot be find' }
        });
        return;
      }
      const operations: Promise<void>[] = [];
      //Push initial
      operations.push(new Promise((resolve) => fs.cp(ipath, rpath, {
        recursive: true,
        force: false
      }, (err) => err ? console.error(err) : resolve())));
      //Push Resolved assets
      //Push permanent
      operations.push(new Promise((resolve) => fs.cp(getPermaPath(), rpath, {
        recursive: true,
        force: false
      }, (err) => err ? console.error(err) : resolve())));

      await Promise.all(operations);
      //Verify (compare files with assets)
      resolve();
    });
  }

  public async Close(force: boolean) {
    if (force && !this.killProcess()) return false;
    else {
      //Push to perma
      for (const file of this.permanentFileList) {
        const destPath = path.join(getPermaPath(), file.path);
        const filePath = path.join(this._runPath, file.path);
        console.log('Copying ' + filePath + ' into ' + destPath);
        fs.cpSync(filePath, destPath, { recursive: true, force: true });
      }
      //Delete runtime folder
      await rimraf.native(this._runPath, { preserveRoot: false, maxRetries: 10, retryDelay: 10000 }).catch(err => {
        console.error(err);
        return false;
      });
      console.log('Closed Instance !');
      return true;

    }
  }


}
