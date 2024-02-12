import { app, net } from 'electron';
import { isDev } from './main';
import { UpdateCheckOperationResponse } from '../types/Update';
import { Octokit } from 'octokit';
import ConsoleManager, { ProcessType } from '../global/ConsoleManager';
import semver from 'semver/preload';
import { KnownUpdateError, UpdateError } from '../types/Errors';

const console = new ConsoleManager('Updated', ProcessType.Internal);

/**
 * Return if Update exist and provide infos about it
 *
 * Will return false if dev mode
 */
export async function checkForUpdate(): Promise<UpdateCheckOperationResponse | UpdateError> {
  //check for process
  if (isDev) return { update: false };
  //check for connexion
  if (net.isOnline()) {
    console.log('Checking for updates...');
    //Getting from github
    const Github = new Octokit();
    const operation = Github.request('GET /repos/BushLauncher/Launcher/releases/latest');
    operation.catch((err) => {
      console.error('Couldn\'t check for updates: ', err);
      return (err);
    });
    return operation.then((response): UpdateCheckOperationResponse => {
      const data = response.data;
      const localVersion = app.getVersion();
      //lt = v1 < v2 ?
      if (semver.lt(data.name, localVersion)) {
        console.log('Update available...');
        return ({
          update: true,
          updateData: {
            version: data.name,
            url: data.assets[0].browser_download_url,
            size: data.assets[0].size
          }
        });
      } else {
        console.log('No Update available');
        return { update: false };
      }
    });
  } else {
    console.log('Cannot check for update, network unavailable');
    return KnownUpdateError.NoNetwork;
  }
}
