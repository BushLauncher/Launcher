import { app, net } from 'electron';
import Window from './Window';
import { Octokit } from 'octokit';
import { Update } from './downloader';
import fs from 'fs';
import path from 'path';
import { compareVersion } from '../global/Utils';

const prefix = '[PreLoadWindow]: ';

export default class PreloadWindow extends Window {

  constructor() {
    super({
      additionalParams: { title: 'Loading', transparent: true, backgroundColor: undefined, width: 670, maxWidth: 670 },
      contentPath: process.env.NODE_ENV === 'development' ? path.join(__dirname, '../renderer/preLoad.html') : path.join(__dirname, '../renderer/preLoad.html')
    });
  }

  modifyMainText(text: string) {
    this.window.webContents.send('PreLoad:setText', { text: text });
  }

  /**
   * @Return if update was installed and launcher must restart
   * @constructor
   */
  async Run(): Promise<boolean> {
    this.modifyMainText('Initializing...');
    this.show();
    this.modifyMainText('Checking for update...');
    if (net.isOnline()) {
      //check for update
      if (process.env.NODE_ENV !== 'development') {
        const update = await this.checkForUpdatesExist();
        if (update === false) {
          //get if download file exist in temp delete it
          const tempPath = app.getPath('temp').replaceAll('\\', '/');
          const downloadFilePath = tempPath + '\\bushLauncherUpdate.exe';
          if (fs.existsSync(downloadFilePath)) {
            console.log(prefix + 'Founded download file in temp, deleting it');
            fs.unlinkSync(downloadFilePath);
          }
          return false;
        } else return await Update(update, (text) => this.modifyMainText(text))
          .catch(err => {
            this.modifyMainText(err);
            return false;
          });
      } else return false;
    } else {
      this.modifyMainText('Starting offline mode...');
      return false;
    }

  }


  private checkForUpdatesExist() {
    return new Promise<false | toDownloadData>((resolve, reject) => {
      console.log('Checking for updates...');
      new Octokit().request('GET /repos/BushLauncher/Launcher/releases/latest')
        .then((githubResponse) => {
          console.log('Got response from GitHub API');
          let res = githubResponse.data;
          const localVersion = app.getVersion();
          if (compareVersion(res.name.replace('v', ''), localVersion) === 1) {
            console.log('Update available...');
            resolve({
              version: res.name.replace('v', ''),
              url: res.assets[0].browser_download_url,
              size: res.assets[0].size
            });
          } else {
            console.log('No Update available');
            resolve(false);
          }
        })
        .catch((err) => {
          console.error('Couldn\'t check for updates');
          console.error(err);
          reject(err);
        });
    });
  }

}

export type toDownloadData = {
  version: string,
  url: string,
  size: number
}

