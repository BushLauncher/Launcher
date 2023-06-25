import { MCProfile } from 'msmc/types/assets';
import { MSAuthToken } from 'msmc/types/auth/auth';

export enum AuthProviderType {
  Microsoft = 'Microsoft',
  Unknown = 'Unknown'
}

export interface MinecraftAccount {
  readonly mcToken: string;
  readonly profile: MCProfile;
  readonly xuid: string;
  readonly exp: number;
  readonly authType: AuthProviderType;
  readonly msToken: MSAuthToken;
  readonly true: true;
}

export interface FakeMinecraftAccount {
  readonly profile: MCProfile;
  readonly true: false;
  readonly authType: AuthProviderType.Unknown;
}
