// noinspection TypeScriptUMDGlobal

import { userDataStorage } from '../main/main';
import { Auth, Minecraft, Xbox } from 'msmc';
import { AuthProviderType, knownAuthError, MinecraftAccount } from './public/AuthPublic';
import { MSAuthToken } from 'msmc/types/auth/auth';

const prefix = '[AuthModule Internal]: ';

const auth = new Auth('login');
auth.on('load', (asset, message) =>
  console.log(prefix + asset + ' ' + message)
);


export function AddAccount(user: MinecraftAccount): boolean {
  console.log(prefix + 'Adding a new Account...');
  if (isAccountValid(user)) {
    return addToStorage(user);
  } else throw new Error('The new Account is not valid !');
}

export async function RefreshAccount(a: string | MinecraftAccount): Promise<MinecraftAccount | knownAuthError.CannotRefreshAccount> {
  const refresh_token = (typeof a === 'string' ? a : a.msToken.refresh_token);
  return auth.refresh(refresh_token).then(async res => {
    return await XboxToUser(res);
  }).catch(err => {
    console.log('We couldn\'t refresh account, ', err);
    return knownAuthError.CannotRefreshAccount;
  });

}

export async function Login(type: AuthProviderType): Promise<MinecraftAccount> {
  return new Promise<MinecraftAccount>((resolve, reject) => {
    console.log(prefix + 'Login-in...');
    if (type in AuthProviderType) {
      if (type == AuthProviderType.Microsoft) {
        console.log(`${prefix}Logging-in a new User with: ${type}`);
        auth
          .launch('electron')
          .then(async (res: Xbox) => {
            resolve(await XboxToUser(res));
          })
          .catch((err: string) => {
            if (err == 'error.gui.closed') reject(knownAuthError.ClosedByUser);
            else reject(err);
          });
      } else throw new Error(`The ${type} auth provider is not implemented`);
    } else throw new Error(`The ${type} auth provider don't has a good type`);
  });
}

export function SelectAccount(accountToSelect: number | MinecraftAccount) {
  let id = -1;
  if (typeof accountToSelect !== 'number') {
    const list: MinecraftAccount[] = getAccountList();
    if (!list.includes(accountToSelect))
      throw new Error('Account list don\'t contain account: ' + accountToSelect);
    id = list.indexOf(accountToSelect);
  } else id = accountToSelect;
  changeSelectedAccountId(id);
  console.log(prefix + 'Selected account: ' + id);
  //TODO: Recheck account validity after select it
}

function changeSelectedAccountId(id: number) {
  try {
    userDataStorage.update('auth.selectedAccount', id);
  } catch (err: any) {
    throw new Error(err);
  }
}

export function getAccountList(): MinecraftAccount[] {
  const list: MinecraftAccount[] | undefined =
    userDataStorage.get('auth.accountList');
  if (list === undefined) return [];
  return list;
}

export function getSelectedAccountId(): number | null | undefined {
  return userDataStorage.get('auth.selectedAccount');
}

export function getSelectedAccount(): MinecraftAccount | null {
  return getAccount(<number>getSelectedAccountId());
}

export function getAccount(id: number): MinecraftAccount | null {
  return getAccountList()[id];
}

export function replaceAccount(id: number, account: MinecraftAccount) {
  const list = getAccountList();
  list[id] = account;
  userDataStorage.update('auth.accountList', list);
}

export function removeAccount(indexToDelete: number) {
  const list = removeFromList(indexToDelete);
  //we must change the selected Account id because the array's ids were changed
  //index to delete cannot be === to the selected account
  const selectedAccountId = getSelectedAccountId();
  if (selectedAccountId != null && selectedAccountId > indexToDelete) {
    SelectAccount(selectedAccountId - 1);
  }
  UpdateStorageAccountList(list);
  console.log(`${prefix}Removed account: ${indexToDelete}`);
}

export function isAccountValid(account: MinecraftAccount): boolean {
  return account.exp > Date.now();
}

export function LogOutAccount(indexToLogOut: number) {
  //there isn't function to logout in msmc
  //so juste remove from storage
  removeAccount(indexToLogOut);
}

export function LogOutAllAccount() {
  //there isn't function to logout in msmc
  //so juste remove all from storage
  userDataStorage.set('auth.accountList', []);
  userDataStorage.set('auth.selectedAccount', null);
}

function addToStorage(account: MinecraftAccount): boolean {
  try {
    const list: MinecraftAccount[] = addToList(account);
    userDataStorage.update('auth.accountList', list);
    SelectAccount(list.length - 1);
    return true;
  } catch (err: any) {
    throw new Error(err);
  }
}

function UpdateStorageAccountList(list: MinecraftAccount[]) {
  try {
    userDataStorage.update('auth.accountList', list);
  } catch (err: any) {
    throw new Error(err);
  }
}

function addToList(userToAdd: MinecraftAccount): MinecraftAccount[] {
  //to get the new account id: [list.length -1] because the account is added to the end of array
  const list: MinecraftAccount[] = getAccountList();
  list.push(userToAdd);
  return list;
}

function removeFromList(indexToDelete: number): MinecraftAccount[] {
  const list: MinecraftAccount[] = getAccountList();
  list.splice(indexToDelete, 1);
  return list;
}

function ConstructMinecraftUser(Minecraft: Minecraft, authType: AuthProviderType, msToken: MSAuthToken): MinecraftAccount {
  return <MinecraftAccount>{
    mcToken: Minecraft.mcToken,
    msToken: msToken,
    profile: Minecraft.profile,
    xuid: Minecraft.xuid,
    exp: Minecraft.exp,
    authType: authType,
    true: true
  };
}

function XboxToUser(xbox: Xbox): Promise<MinecraftAccount> {
  return new Promise((resolve, reject) => {
    xbox.getMinecraft()
      .then((MinecraftLoggedUser: Minecraft) => {
        if (MinecraftLoggedUser.validate()) {
          if (MinecraftLoggedUser.profile !== undefined) {
            const User: MinecraftAccount =
              ConstructMinecraftUser(MinecraftLoggedUser, AuthProviderType.Microsoft, xbox.msToken);
            console.log(`${prefix}Logged new Account: ${User.profile?.name}`);
            resolve(User);
          } else throw new Error('User don\'t have Mc profile');
        } else
          throw new Error('The newest logged account is not valid !');
      })
      .catch((err) => {
        if (err == 'error.auth.xsts.userNotFound') reject(knownAuthError.UserDontHasGame);
        else reject(err);
      });
  });
}
