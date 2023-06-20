import { LaunchTaskState, ProgressSubTaskCallback } from './public/GameData';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import axios from 'axios';
import admZip from 'adm-zip';
import { knowGameError, knowGameErrorFormat } from './public/ErrorDecoder';
import { userDataStorage } from '../main/main';
import { getPotentialJavaLocations } from '@xmcl/installer';
import { findFileRecursively } from './GameFileManager';

const prefix = '[JavaEngine]: ';

export async function installJava(callback: (c: ProgressSubTaskCallback) => void): Promise<string> {
  console.log(prefix + prefix + 'installing Java...');
  callback({ state: LaunchTaskState.processing, displayText: 'Installing Java...' });
  const dir = path.join(app.getPath('userData'), 'Local Java\\');
  const tempDownloadDir = path.join(app.getPath('userData'), 'Download Cache\\');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  if (!fs.existsSync(tempDownloadDir)) fs.mkdirSync(tempDownloadDir);
  const downloadData = await getJavaDownloadLink();
  const zipPath = path.join(tempDownloadDir, downloadData.name);
  //remove the extension: .zip
  const destPath = path.join(dir, downloadData.name.replace('\\.([a-z]*$)', ''));
  return new Promise<string>((resolve, reject) => {
    console.log(prefix + 'Create stream');
    const stream = fs.createWriteStream(zipPath);
    console.log(prefix + 'Downloading...');
    callback({ state: LaunchTaskState.processing, displayText: 'Downloading Java...' });
    axios.get(downloadData.link, {
      responseType: 'stream',
      onDownloadProgress: progressEvent => {
        const downloadPercentage = Math.floor(
          (progressEvent.loaded * 100) / (progressEvent.total ? progressEvent.total : downloadData.size)
        );
        console.log(prefix + 'Downloading Java: ' + downloadPercentage + '%');
        callback({
          state: LaunchTaskState.processing,
          displayText: 'Downloading Java...',
          localProgress: downloadPercentage
        });
      }
    })
      .then(axiosResponse => {
        return new Promise<void>((resolve, reject) => {
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
        console.log(prefix + 'Extraction started');
        callback({ state: LaunchTaskState.processing, displayText: 'Extracting Java...' });
        return new admZip(zipPath).extractAllTo(destPath, false, true);
      })
      .then(() => {
        console.log(prefix + 'Extraction completed');
        // Handle further operations after successful extraction
        const finalPath = findFileRecursively(destPath, 'javaw.exe');
        if (finalPath === undefined) throw new Error(finalPath);
        userDataStorage.set('saved.javaPath', finalPath);
        resolve(finalPath);
      })
      .catch(err => console.error(err));

  });
}

export type JavaDownloadData = {
  link: string,
  name: string,
  size: number,
  releaseLink: string
}

export async function getJavaDownloadLink(): Promise<JavaDownloadData> {
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
      reject(<knowGameErrorFormat>{ ...knowGameError.JavaCannotGetDownloadDataError, additionalError: err });
    });
  });
}


export async function resolveJavaPath(): Promise<string | undefined> {
  const saved = getSavedJavaPath();
  return saved !== undefined && fs.existsSync(saved) ? saved : undefined;
  //return await findJava();
}

export function getSavedJavaPath(): string | undefined {
  const path: string | null | undefined = userDataStorage.get('saved.javaPath');
  return (path != null && fs.existsSync(path)) ? path : undefined;
}

/**
 * We won't search Java anymore, due to too multiple possibilities of Java version
 * @deprecated
 */
export function findJava(): Promise<string | undefined> {
  return new Promise(async (resolve, reject) => {
    await getPotentialJavaLocations()
      .then((pathList: string[]) => {
        //test for result
        for (const path of pathList) {
          if (fs.existsSync(path)) {
            resolve(path);
            return;
          }
        }
        //if pathList empty or all tested path aren't valid
        resolve(undefined);
      }).catch(err => reject(err));
  });
}
