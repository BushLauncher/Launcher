import { currentWindow, userDataStorage } from '../main';
import { Auth, Minecraft, Xbox } from 'msmc';
import { AuthProviderType, MinecraftAccount } from '../../public/AuthPublic';
import { MSAuthToken } from 'msmc/types/auth/auth';
import { KnownAuthErrorType } from '../../public/ErrorPublic';
import { MicrosoftAuthenticator } from '@xmcl/user';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';

const console = new ConsoleManager("AuthModule", ProcessType.Internal);


const auth = new Auth('login');
auth.on('load', (asset, message) =>
  console.log(`[Auth Provider (msmc)] ${asset}: ${message}`)
);



export function AddAccount(user: MinecraftAccount) {
  console.log('Adding a new Account...');
  if (isAccountValid(user)) {
    if (addToStorage(user)) SelectAccount(getAccountList().length - 1);
  } else throw new Error('The new Account is not valid !');
}

export async function RefreshAccount(id: number | MinecraftAccount): Promise<MinecraftAccount | KnownAuthErrorType.CannotRefreshAccount> {
  const account = (typeof id === 'number') ? getAccount(id) : id;
  const refresh_token = account.msToken.refresh_token;
  return auth.refresh(refresh_token)
    .then(async res => {
      return await xboxToUser(res);
    }).catch(err => {
      console.log('We couldn\'t refresh account, ', err);
      return KnownAuthErrorType.CannotRefreshAccount;
    });
}

export async function Login(providerType: AuthProviderType): Promise<MinecraftAccount> {
  return new Promise<MinecraftAccount>((resolve, reject) => {
    switch (providerType) {
      case AuthProviderType.Microsoft: {
        console.log(`Logging-in a new User with: ${providerType}`);
        return auth.launch('electron')
          .then(async (res: Xbox) => {
            resolve(await xboxToUser(res));
          })
          .catch((err: string) => {
            if (err == 'error.gui.closed') reject(KnownAuthErrorType.ClosedByUser);
            else reject(err);
          });
      }
      default :
        throw new Error(`The ${providerType} auth provider is not implemented`);
    }
  });
}

export function SelectAccount(account: number | MinecraftAccount) {
  account = (typeof account === 'number') ? getAccount(account) : account;
  const id = resolveUserId(account);
  if (updateStorage('selectedAccount', id)) {
    console.log('Selected account: ' + id + ', sent verify process');
    currentWindow?.webContents.send('Auth:CheckAccountProcess', { user: account, id: id });
    return true;
  } else throw new Error('Cannot select Account, local update error');
}

export function getAccountList(): MinecraftAccount[] {
  const list: MinecraftAccount[] | undefined = userDataStorage.get('auth.accountList');
  return (list === undefined) ? [] : list;
}

export function getSelectedAccountId(): number | null | undefined {
  return userDataStorage.get('auth.selectedAccount');
}

export function getSelectedAccount(): MinecraftAccount | null {
  const id = getSelectedAccountId();
  if (id === null || id === undefined) return null;
  return getAccount(id);
}

export function getAccount(id: number): MinecraftAccount {
  const res = getAccountList()[id];
  if (res === null) {
    throw new Error('Cannot get account with id: ' + id);
  }
  return res;
}

export function ReplaceAccount(id: number, account: MinecraftAccount) {
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

export function isAccountValid(account: MinecraftAccount): boolean {

  //console.log(account.createdDate + ' + ' + (account.msToken.expires_in * 1000) + ' = ' + (account.createdDate + (account.msToken.expires_in * 1000)) + '\n' + Date.now());
  //validate account               +                  msToken
  return account.exp > Date.now() && (account.createdDate + (account.msToken.expires_in * 1000)) > Date.now();

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

function addToStorage(accountToAdd: MinecraftAccount): boolean {
  return updateStorage('accountList', addToList(accountToAdd));
}

function updateStorage(id: string, value: any): boolean {
  try {
    userDataStorage.update('auth.' + id, value);
    return true;
  } catch (err: any) {
    console.error(err);
    return false;
  }
}

function addToList(userToAdd: MinecraftAccount): MinecraftAccount[] {
  const list: MinecraftAccount[] = getAccountList();
  list.push(userToAdd);
  return list;
}

function removeFromList(indexToDelete: number): MinecraftAccount[] {
  const list: MinecraftAccount[] = getAccountList();
  list.splice(indexToDelete, 1);
  //splice don't return modified array but apply it on 'list' !
  return list;
}

function constructMinecraftUser(Minecraft: Minecraft, authType: AuthProviderType, msToken: MSAuthToken): MinecraftAccount {
  return <MinecraftAccount>{
    mcToken: Minecraft.mcToken,
    msToken: msToken,
    profile: Minecraft.profile,
    xuid: Minecraft.xuid,
    exp: Minecraft.exp,
    authType: authType,
    true: true,
    createdDate: new Date().getTime()
  };
}

function xboxToUser(xbox: Xbox): Promise<MinecraftAccount> {
  return new Promise((resolve, reject) => {
    xbox.getMinecraft()
      .then((MinecraftLoggedUser: Minecraft) => {
        if (MinecraftLoggedUser.validate()) {
          if (MinecraftLoggedUser.profile !== undefined) {
            const User: MinecraftAccount =
              constructMinecraftUser(MinecraftLoggedUser, AuthProviderType.Microsoft, xbox.msToken);
            console.log(`Logged new Account: ${User.profile?.name}`);
            resolve(User);
          } else throw new Error('User don\'t have Mc profile');
        } else
          throw new Error('The newest logged account is not valid !');
      })
      .catch((err) => {
        if (err == 'error.auth.xsts.userNotFound') reject(KnownAuthErrorType.UserDontHasGame);
        else reject(err);
      });
  });
}

export function resolveUserId(user: MinecraftAccount) {
  const list: MinecraftAccount[] = getAccountList();
  if (!list.includes(user)) throw new Error('Account list don\'t contain account: ' + user);
  return list.indexOf(user);
}

export async function getAccessToken(account: MinecraftAccount) {
  const authenticator = new MicrosoftAuthenticator();
  const { minecraftXstsResponse, liveXstsResponse } = await authenticator.acquireXBoxToken(account.msToken.access_token);
  return await authenticator.loginMinecraftWithXBox(minecraftXstsResponse.DisplayClaims.xui[0].uhs, minecraftXstsResponse.Token);
}
