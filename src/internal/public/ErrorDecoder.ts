import { knownAuthError } from './AuthPublic';

export function DecodeIpcMain(errorMessage: string): string | knownAuthError {
  //transform
  // "Error: Error invoking remote method 'Auth:Login': UserDontHasGame"
  //into "UserDontHasGame"
  //then knownAuthError.UserDontHasGame
  const startIndex: number = errorMessage.lastIndexOf(':') + 1; // Find the last occurrence of ':' and add 1 to get the starting index
  const errorCode: string = errorMessage.slice(startIndex).trim();

  //verify
  if (Object.values(knownAuthError).includes(errorMessage as unknown as knownAuthError)) {
    return knownAuthError[errorMessage as unknown as knownAuthError];
  } else return errorCode;

}

export enum knowGameErrorType {
  AccountNotValidError = 'AccountNotValidError',
  JavaCannotInstallError = 'JavaCannotInstallError',
  JavaCannotGetDownloadDataError = 'JavaCannotGetDownloadDataError',
  GameFileCannotInstallError = 'GameFileCannotInstallError',
}

export type knowGameErrorFormat = {
  message: string,
  desc?: string,
  resolution?: string,
  additionalError?: any
}
export const knowGameError: {
  [key in keyof typeof knowGameErrorType]: knowGameErrorFormat
} = {
  AccountNotValidError: {
    message: 'Account is not valid',
    desc: 'The selected account cannot be validate, or is null, or is corrupted.',
    resolution: 'You must re-log the account by re-typing your login data.'
  },
  GameFileCannotInstallError: {
    message: 'Game files couldn\'t be installed'
  },
  JavaCannotGetDownloadDataError: {
    message: 'Cannot get download data from Adoptium',
    desc: 'got an Error trying to get the download data from Adoptium API',
    resolution: 'Be sure in additionalError the URL don\'t contain \'undefined\' or \'null\' data,n\ Check the Adoptium API services at https://www.eclipsestatus.io/'
  },
  JavaCannotInstallError: {
    message: 'Java cannot be installed',
    desc: 'Java runnable path was not detected on the computer and could\'n be installed',
    resolution: 'Install Java manually on https://www.java.com/fr/, or review your system PATH config'
  }
};


export enum CallbackType {
  Error = 'Error',
  Progress = 'Progress',
  Success = 'Success',
  Closed = 'Closed',
}
