import { app, shell } from 'electron';
import path from 'path';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { toDownloadData } from './PreloadWindow';

const prefix = '[Downloader, MainProcess]: ';

export function Update(potentialUpdate: toDownloadData, callbackText: (text: string) => any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    callbackText('Starting Download...');
    Download(potentialUpdate.url, (downloadPercentage: any) => callbackText('Updating... ' + downloadPercentage + '%'))
      .then(appPath => {
        callbackText('Running...');
        shell.openExternal(appPath)
          .then(() => resolve(true))
          .catch(err => {
            console.error(err);
            return;
          });
      })
      .catch(error => {
        console.error('Cannot update: ');
        console.error(error);
        reject({ updated: false, code: error.code, message: error.return });
      });
  });
}

function Download(url: string, callback: any): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('updating...');
    axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      onDownloadProgress: progressEvent => {
        // @ts-ignore
        const downloadPercentage = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
        console.log('Downloading update: ' + downloadPercentage + '%');
        callback(downloadPercentage);
      }
    })
      .then(axiosResponse => {
        try {
          axiosResponse.data.pipe(createWriteStream(path.join(app.getPath('temp'), `bushLauncherUpdate.exe`)))
            .on('finish', () => resolve(path.join(app.getPath('temp'), 'bushLauncherUpdate.exe')))
            .on('error', (error: any) => reject(error))
            .on('onDownloadProgress', (progress: any) => console.log(progress));
        } catch (err) {
          console.error(err);
          reject(err);
        }
      })
      .catch(() => {
        reject('Couldn\'t update, please restart the launcher.');
        console.error('Couldn\'t download the update');
      });
  });
}

