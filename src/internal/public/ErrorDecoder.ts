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
