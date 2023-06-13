const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const { createWriteStream } = require('fs');
const { join } = require('path');
const { execFile: child } = require('child_process');

const prefix = '[Downloader, MainProcess]: ';

export function update(potentialUpdate, callbackText) {
  return new Promise((resolve, reject) => {
    callbackText('Starting Download...');
    download(potentialUpdate.downloadData.url, downloadPercentage => {
      callbackText('Downloading... [' + downloadPercentage + '%]');
    })
      .then(appPath => {
        callbackText('Running...');
        child(appPath, function(err, data) {
          if (err) {
            console.error(err);
            return;
          }
          resolve({ updated: true, code: 200, message: 'updated' });
        });
      })
      .catch(error => {
        console.error('Cannot update: ');
        console.error(error);
        reject({ updated: false, code: error.code, message: error.return });
      });
  });
}

function download(url, callback) {
  return new Promise((resolve, reject) => {
    console.log('updating...');
    axios({
      method: 'get',
      url: [url],
      responseType: 'stream',
      onDownloadProgress: progressEvent => {
        const downloadPercentage = Math.floor(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log('Downloading: ' + downloadPercentage + '%');
        callback(downloadPercentage);
      }
    })
      .then(axiosResponse => {
        try {
          axiosResponse.data
            .pipe(
              createWriteStream(
                path.join(app.getPath('temp'), 'bushLauncherUpdate.exe')
              )
            )
            .on('finish', () => {
              resolve(join(app.getPath('temp'), 'bushLauncherUpdate.exe'));
            })
            .on('error', error => {
              reject(error);
            })
            .on('onDownloadProgress', progress => {
              console.log(progress);
            });
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

