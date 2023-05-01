import { MCProfile } from 'msmc/types/assets';

export enum AuthProviderType {
  Microsoft = 'Microsoft',
}

export type errorCode = knownAuthError | string;

export enum knownAuthError {
  ClosedByUser = 'ClosedByUser',
  UserDontHasGame = 'UserDontHasGame'
}

export interface MinecraftAccount {
  readonly mcToken: string;
  readonly profile: MCProfile | undefined;
  readonly xuid: string;
  readonly exp: number;
  readonly authType: AuthProviderType;
}
