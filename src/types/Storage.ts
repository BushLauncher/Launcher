import { Themes } from './Theme';
import { GameVersion } from './Versions';
import { Xbox } from 'msmc';
import { Account } from './AuthPublic';

interface InterfaceData {
  selectedTab: string;
  theme: Themes;
  isMenuCollapsed: boolean;
}

export interface AuthData {
  accountList: Account[];
  selectedAccount: number | null;
}

interface SavedData {
  javaPath: string | null;
  rootPath: string | null;
}

export interface defaultData {
  interface: InterfaceData;
  version: {
    selected?: {key: string, selected: GameVersion}[];
  };
  auth: AuthData;
  saved: SavedData;
}
