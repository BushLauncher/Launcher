import { Lexcodes } from 'msmc/types/assets';

export type GenericError = AuthError | string;

export enum KnowGameErrorType {
  AccountNotValidError = 'AccountNotValidError',
  JavaCannotInstallError = 'JavaCannotInstallError',
  JavaCannotGetDownloadDataError = 'JavaCannotGetDownloadDataError',
  GameFileCannotInstallError = 'GameFileCannotInstallError',
}

export function isError(error: any): error is GenericError {
  return typeof error === 'string' || Object.values(KnownAuthErrorType).includes(error) || typeof error === 'object' && 'errno' in error;
}

export type knowErrorFormat = {
  message: string, desc?: string | JSX.Element, resolution?: string, additionalError?: any
}

//Auth Errors
export enum KnownAuthErrorType {
  ClosedByUser = 'ClosedByUser',
  UserDontHasGame = 'UserDontHasGame',
  UserAlreadyRegistered = 'UserAlreadyRegistered'
}

export type AuthError = KnownAuthErrorType | Lexcodes | { errno: string } | string;

//Game Errors
export const knowGameError: { [key in keyof typeof KnowGameErrorType]: knowErrorFormat } = {
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



