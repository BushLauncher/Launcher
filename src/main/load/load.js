/*from the main Process*/
const fs = require('fs');
const { Octokit } = require('octokit');
let loaded = false;
const octokit = new Octokit();
const pkg = require('../../../package.json').version;
const prefix = '[PreLoad]: ';
const { net } = require('electron');

export default class PreLoad {
  constructor(updateText, tempPath) {
    this.setText = updateText;
    this.tempPath = tempPath;
    this.isOnline = net.isOnline();
    console.log('Network: ' + this.isOnline);
  }

  run() {
    return new Promise((resolve, reject) => {
      console.log(prefix + 'STARTING');
      //check network
      if (!this.isOnline) {
        resolve({ skipped: true });
      } else {
        const checkForUpdatesProcess = () => {
          return new Promise((resolve, reject) => {
            this.checkForUpdates((newText) => {
              this.setText(newText);
            })
              .then((potentialUpdate) => resolve(potentialUpdate))
              .catch((err) => {
                console.error(prefix + 'Cannot Update: ');
                console.error(err);
              });
          });
        };

        //Process START
        checkForUpdatesProcess().then((potentialUpdate) => {
          if (potentialUpdate.exist) resolve(potentialUpdate);
          else {
            this.setText('Loading...');
            //get if download file exist in temp delete it
            const downloadFilePath = this.tempPath + '\\bushLauncherUpdate.exe';
            if (fs.existsSync(downloadFilePath)) {
              fs.unlinkSync(downloadFilePath);
              console.log(
                prefix + 'Founded download file in temp, deleting it'
              );
            }

            //Process END
            loaded = true;
            resolve({ exist: false, skipped: false });
          }
        });
      }
    });
  }

  checkForUpdates(callbackText) {
    return new Promise((resolve, reject) => {
      if (this.isOnline) {
        callbackText('Checking for updates...');
        this.checkForUpdatesExist()
          .then((potentialUpdate) => {
            resolve(potentialUpdate);
          })
          .catch((error) => {
            reject({
              updated: false,
              code: error.status,
              message: error.message,
            });
          });
      } else {
        reject({ updated: false, code: -1, message: 'Network not available' });
      }
    });
  }

  checkForUpdatesExist() {
    return new Promise((resolve, reject) => {
      console.log('Checking for updates...');
      octokit
        .request('GET /repos/{owner}/{repo}/releases/latest', {
          owner: 'Gagafeee',
          repo: 'BushLauncher',
        })
        .then((r) => {
          console.log('Got response from GitHub API');
          let res = r.data;
          if (!pkg) reject('cannot find local version');
          if (compareVersion(res.name.replace('v', ''), pkg) === 1) {
            console.log('Update is available...');
            resolve({
              exist: true,
              downloadData: {
                version: res.name.replace('v', ''),
                url: res.assets[0].browser_download_url,
                size: res.assets[0].size,
              },
            });
          } else {
            console.log('Update not available');
            resolve({ exist: false });
          }
        })
        .catch((err) => {
          console.error("Couldn't check for updates");
          console.error(err);
          reject(err);
        });
    });
  }
}

function compareVersion(v1, v2) {
  if (typeof v1 !== 'string') return false;
  if (typeof v2 !== 'string') return false;
  v1 = v1.split('.');
  v2 = v2.split('.');
  const k = Math.min(v1.length, v2.length);
  for (let i = 0; i < k; ++i) {
    v1[i] = parseInt(v1[i], 10);
    v2[i] = parseInt(v2[i], 10);
    if (v1[i] > v2[i]) return 1;
    if (v1[i] < v2[i]) return -1;
  }
  return v1.length === v2.length ? 0 : v1.length < v2.length ? -1 : 1;
}
