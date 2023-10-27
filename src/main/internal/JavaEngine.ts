import { LaunchTaskState, SubLaunchTaskCallback } from '../../types/Versions';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import admZip from 'adm-zip';
import { knowErrorFormat, knowGameError } from '../../types/Errors';
import { userDataStorage } from '../main';
import { deleteFolderRecursive, findFileRecursively } from './FileManager';
import { javaPath, tempDownloadDir } from './DataManager';
import ConsoleManager, { ProcessType } from '../../global/ConsoleManager';

const console = new ConsoleManager('JavaEngine', ProcessType.Internal);


export async function InstallJava(callback: (c: SubLaunchTaskCallback) => void): Promise<string> {
  console.warn('Installing Java...');
  callback({ state: LaunchTaskState.processing, displayText: 'Installing Java...' });

  const downloadData = await getJavaDownloadLink();
  const zipPath = path.join(tempDownloadDir, downloadData.name);
  if (!fs.existsSync(tempDownloadDir)) fs.mkdirSync(tempDownloadDir);
  //remove the extension: .zip
  const destPath = path.join(javaPath, downloadData.name.replace('\\.([a-z]*$)', ''));
  console.log(zipPath);


  return new Promise<string>((resolve, reject) => {
    const stream = fs.createWriteStream(zipPath);
    console.log('Downloading...');
    callback({ state: LaunchTaskState.processing, displayText: 'Downloading Java...' });

    axios.get(downloadData.link, {
      responseType: 'stream',
      onDownloadProgress: progressEvent => {
        const downloadPercentage = Math.floor((progressEvent.loaded * 100) / (progressEvent.total || downloadData.size));
        console.log('Downloading Java: ' + downloadPercentage + '%');
        callback({
          state: LaunchTaskState.processing,
          displayText: 'Downloading Java...',
          data: {
            localProgress: downloadPercentage
          }
        });
      }
    })
      .then(axiosResponse => {
        return new Promise<void>((resolve, reject) => {
          console.log(destPath);
          callback({ state: LaunchTaskState.processing, displayText: 'Writing Java...' });
          axiosResponse.data.pipe(stream)
            .on('finish', () => {
              stream.end();
              resolve();
            })
            .on('error', (error: any) => {
              reject(error);
              stream.end();
            });
        });
      })
      .then(() => {
        console.log('Extracting...');
        callback({ state: LaunchTaskState.processing, displayText: 'Extracting Java...' });
        return new admZip(zipPath).extractAllTo(destPath, true, true);
      })
      .then(() => {
        console.log('Extraction completed');
        const finalPath = findFileRecursively(destPath, 'javaw.exe');
        if (finalPath === undefined) throw new Error(finalPath);
        userDataStorage.set('saved.javaPath', finalPath);
        resolve(finalPath);
      })
      .catch(err => {
        console.error(err);
        reject();
      });

  });
}

export type javaDownloadData = {
  link: string,
  name: string,
  size: number,
  releaseLink: string
}

export async function getJavaDownloadLink(): Promise<javaDownloadData> {
  return new Promise((resolve, reject) => {
    let os: string = process.platform;
    if (os === 'win32') os = 'windows';
    if (os === 'darwin') os = 'mac';
    const url = `https://api.adoptium.net/v3/assets/latest/17/hotspot?architecture=x64&image_type=jre&os=${os}&vendor=eclipse`;
    axios.get(url, {
      responseType: 'json'
    })
      .then(jsonResponse => {
        const packages = jsonResponse.data[0].binary.package;
        resolve({
          link: packages.link,
          name: packages.name,
          size: packages.size,
          releaseLink: jsonResponse.data[0].release_link
        });
      }).catch(err => {
      console.error('We couldn\'t get the json download data for ' + os);
      console.error(err);
      reject(<knowErrorFormat>{ ...knowGameError.JavaCannotGetDownloadDataError, additionalError: err });
    });
  });
}


export async function ResolveJavaPath(): Promise<string | undefined> {
  const saved = getSavedJavaPath();
  return saved !== undefined && fs.existsSync(saved) ? saved : undefined;
  //return await findJava();
}

export function DeleteJava() {
  deleteFolderRecursive(javaPath);
  userDataStorage.remove('saved.javaPath');
}

export function getSavedJavaPath(): string | undefined {
  const path: string | null | undefined = userDataStorage.get('saved.javaPath');
  return (path != null && fs.existsSync(path)) ? path : undefined;
}
