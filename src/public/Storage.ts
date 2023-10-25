import { Themes } from './ThemePublic';
import { GameVersion } from './GameDataPublic';
import { Xbox } from 'msmc';

interface InterfaceData {
  selectedTab: string;
  theme: Themes;
  isMenuCollapsed: boolean;
}

interface AuthData {
  accountList: Xbox[];
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
