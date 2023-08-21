import fs from 'fs';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';
import { getRuntimePath } from './Core';
import * as Path from 'path';
import { CallbackType, ExitedCallback, ExitedReason } from '../../public/GameDataPublic';

/**
 * @param path instance folder path
 */
export interface RunnableParam {
  id: string;
  path: string;
}

export class Runtime {
  readonly instanceFolder!: string;
  private readonly console: ConsoleManager;
  private readonly _runPath!: string;

  constructor({ id, path }: RunnableParam) {
    this.console = new ConsoleManager('Composer:' + id, ProcessType.Internal);
    this._runPath = Path.join(getRuntimePath(), '/' + id);
    this.instanceFolder = path;
    console.log('Running in: ' + this._runPath);
  }

  get runPath(): string {
    return this._runPath;
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
      //Push initial
      fs.cpSync(ipath, rpath, { recursive: true, force: false });
      //Push Resolved assets
      //Push permanent
      //Verify (compare files with assets)
      resolve()
    });
  }


}
