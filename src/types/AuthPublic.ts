import { MCProfile } from 'msmc/types/assets';
import { MSAuthToken } from 'msmc/types/auth/auth';
import { Xbox } from 'msmc';

export enum AuthProvider {
  Microsoft = 'Microsoft'
}

export interface Account<Provider = keyof AuthProvider> {
  provider: AuthProvider,
  name: string
  data: Provider
}

export interface MSAccount {
  readonly mcToken: string;
  readonly profile: MCProfile;
  readonly xuid: string;
  readonly exp: number;
  readonly createdDate: number;
  readonly msToken: MSAuthToken;
}


export type AccountCheckOperationResponse = 'validating' | 'done' | 'mustLogin' | 'couldntRevalidate';


