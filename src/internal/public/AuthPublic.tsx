export enum AuthProviderType {
  Microsoft = "Microsoft",
}
export type errorCode = knownAuthError | string;
export enum knownAuthError {
  ClosedByUser = 'ClosedByUser',
  UserDontHasGame = "UserDontHasGame"
}
