import { getDataStorage } from './main';
import { Account, AuthProvider } from '../types/AuthPublic';
import { MicrosoftAuthenticator } from '@xmcl/user';
import ConsoleManager, { ProcessType } from '../global/ConsoleManager';
import { MSLogin, RefreshMSAccount, xboxToUser } from './Logins';
import { AuthError, KnownAuthErrorType } from '../types/Errors';

const console = new ConsoleManager('AuthModule', ProcessType.Internal);

export async function RefreshAccount(id: number | Account<any>): Promise<Account<any> | AuthError> {
  const account = (typeof id === 'number') ? getAccount(id) : id;
  switch (account.provider) {
    case AuthProvider.Microsoft:
      return RefreshMSAccount(account);
  }
}

export function AddAccount(user: Account<any>) {
  console.log('Adding a new Account...');
  if (isAccountValid(user)) {
    if (addToStorage(user)) SelectAccount(getAccountList().length - 1);
  } else throw new Error('The new Account is not valid !');
}

export async function Login(providerType: AuthProvider): Promise<Account<any>> {
  switch (providerType) {
    case AuthProvider.Microsoft: {
      console.log(`Logging-in a new User with: ${providerType}`);
      return MSLogin();
    }
    default :
      throw new Error(`The ${providerType} auth provider is not implemented`);
  }
}


////


export function SelectAccount(id: number) {
  if (updateStorage('selectedAccount', id)) {
    console.log('Selected account: ' + id);
    return true;
  } else throw new Error('Cannot select Account, local update error');
}

export function getAccountList(): Account<any>[] {
  const list: Account<any>[] | undefined = getDataStorage().get('auth.accountList');
  return (list === undefined) ? [] : list;
}

export function getSelectedAccountId(): number | null | undefined {
  return getDataStorage().get('auth.selectedAccount');
}

export function getSelectedAccount(): Account<any> | null {
  const id = getSelectedAccountId();
  if (id === null || id === undefined) return null;
  return getAccount(id);
}

export function getAccount(id: number): Account<any> {
  const res = getAccountList()[id];
  if (res === null) {
    throw new Error('Cannot get account with id: ' + id);
  }
  return res;
}

export function ReplaceAccount(id: number, account: Account<any>) {
  console.log('replacing account ');
  const list = getAccountList();
  list[id] = account;
  updateStorage('accountList', list);
}

export function RemoveAccount(indexToDelete: number) {
  //we must change the selected Account id because the array's ids were changed
  //index to delete cannot be === to the selected account
  const selectedAccountId = getSelectedAccountId();
  if (selectedAccountId != null && selectedAccountId > indexToDelete) {
    SelectAccount(selectedAccountId - 1);
  }
  if (updateStorage('accountList', removeFromList(indexToDelete))) {
    console.log(`Removed account: ${indexToDelete}`);
  } else throw new Error('Cannot remove Account, local update error');
}

export function isAccountValid(account: Account<any>): boolean {

  //console.log(account.createdDate + ' + ' + (account.msToken.expires_in * 1000) + ' = ' + (account.createdDate + (account.msToken.expires_in * 1000)) + '\n' + Date.now());
  //validate account               +                  msToken
  return account.data?.exp > Date.now() && (account.data?.createdDate + (account.data?.msToken.expires_in * 1000)) > Date.now();

}

export function LogOutAccount(indexToLogOut: number) {
  //there isn't function to logout in msmc
  //so juste remove from storage
  RemoveAccount(indexToLogOut);
}

export function LogOutAllAccount() {
  //there isn't function to logout in msmc
  //so juste remove all from storage
  updateStorage('accountList', []);
  updateStorage('selectedAccount', null);
}

///////////////////////////////

function addToStorage(accountToAdd: Account<any>): boolean {
  return updateStorage('accountList', addToList(accountToAdd));
}

function updateStorage(id: string, value: any): boolean {
  try {
    getDataStorage().update('auth.' + id, value);
    return true;
  } catch (err: any) {
    console.error(err);
    return false;
  }
}

function addToList(userToAdd: Account<any>): Account<any>[] {
  const list: Account<any>[] = getAccountList();
  list.push(userToAdd);
  return list;
}

function removeFromList(indexToDelete: number): Account<any>[] {
  const list: Account<any>[] = getAccountList();
  list.splice(indexToDelete, 1);
  //splice don't return modified array but apply it on 'list' !
  return list;
}

export function resolveUserId(user: Account<any>) {
  const list: Account<any>[] = getAccountList();
  if (!list.includes(user)) throw new Error('Account list don\'t contain account: ' + user);
  return list.indexOf(user);
}

export async function getAccessToken(account: Account<any>) {
  const authenticator = new MicrosoftAuthenticator();
  const {
    minecraftXstsResponse,
    liveXstsResponse
  } = await authenticator.acquireXBoxToken(account.data.msToken.access_token);
  return await authenticator.loginMinecraftWithXBox(minecraftXstsResponse.DisplayClaims.xui[0].uhs, minecraftXstsResponse.Token);
}
