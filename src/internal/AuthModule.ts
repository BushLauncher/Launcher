import { userDataStorage } from '../main/main';
import { Auth, Minecraft, Xbox } from 'msmc';
import { AuthProviderType, knownError } from './public/AuthPublic';
import { MCProfile } from 'msmc/types/assets';

const auth = new Auth('login');
auth.on('load', (asset, message) => console.log(asset + ' ' + message));
export async function Login(type: AuthProviderType): Promise<MinecraftAccount> {
  return new Promise<MinecraftAccount>((resolve, reject) => {
    console.log('Login...');
    if (type in AuthProviderType) {
      if (type == AuthProviderType.Microsoft) {
        console.log('Logging-in a new User with: ' + type);
        auth
          .launch('electron')
          .then((res: Xbox) => {
            res
              .getMinecraft()
              .then((MinecraftLoggedUser: Minecraft) => {
                if (MinecraftLoggedUser.validate()) {
                  if (MinecraftLoggedUser.profile !== undefined) {
                    console.log(
                      'Logged new Account: ' + MinecraftLoggedUser.profile?.name
                    );
                    resolve(ConstructMinecraftUser(MinecraftLoggedUser));
                  } else throw new Error("User don't have Mc profile");
                } else
                  throw new Error('The newest logged account is not valid !');
              })
              .catch((err) => console.warn(err));
          })
          .catch((err: string) => {
            if (err == 'error.gui.closed') reject(knownError.ClosedByUser);
            else reject(err);
          });
      } else throw new Error(`The ${type} auth provider is not implemented`);
    } else throw new Error(`The ${type} auth provider don't has a good type`);
  });
}
export function AddAccount(user: MinecraftAccount): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Adding a new Account');
    if (isAccountValid(user)) {
      try {
        const list: MinecraftAccount[] = addAccountToList(user);
        userDataStorage.update('auth.accountList', list);
        SelectAccount(list.length - 1);
        resolve();
      } catch (err: any) {
        reject(err);
        console.error(err);
      }
    } else throw new Error('The new Account is not valid !');
  });
}
export function SelectAccount(accountToSelect: number | MinecraftAccount) {
  let id = -1;
  if (typeof accountToSelect != 'number') {
    const list: MinecraftAccount[] = getAccountList();
    if (!list.includes(accountToSelect))
      throw new Error("Account list don't contain account: " + accountToSelect);
    id = list.indexOf(accountToSelect);
  } else id = accountToSelect;
  console.log('Selecting account: ' + id);
  try {
    userDataStorage.update('auth.selectedAccount', id);
  } catch (err: any) {
    throw new Error(err);
  }
}

export function ValidateAccount(account: MinecraftAccount) {
  //get
  //if not -> reauth
}
export function SwitchAccount(index: number) {
  const list: MinecraftAccount[] = getAccountList();
  if (list[index]) {
    userDataStorage.set('auth.selectedAccount', index);
    console.log('Switching to Account ' + index);
  } else
    throw new Error(
      `Cannot switch to account ${index} Because it doesn't exist on list`
    );
}
export function getAccountList(): MinecraftAccount[] {
  const list: MinecraftAccount[] | undefined =
    userDataStorage.get('auth.accountList');
  if (list === undefined) throw new Error('Account list is undefined');

  return list;
}
export function getSelectedAccountId(): number | null | undefined {
  return userDataStorage.get('auth.selectedAccount');
}
export function getSelectedAccount(): MinecraftAccount | null {
  const id: number | undefined = userDataStorage.get('auth.selectedAccount');
  return id != null ? getAccount(id) : null;
}
export function getAccount(id: number): MinecraftAccount | null {
  const accountList: MinecraftAccount[] | undefined =
    userDataStorage.get('auth.accountList');
  if (accountList == undefined)
    throw new Error('Auth: Cannot get the AccountList');
  return accountList[id];
}
export function removeAccount(account: MinecraftAccount) {}

export function isAccountValid(account: MinecraftAccount): boolean {
  return account.exp > Date.now();
}
export function LogOutAccount(indexToLogOut: number): Promise<MinecraftAccount[]> {
  return new Promise((resolve, reject) => {
    const list = removeAccountToList(indexToLogOut);
    //we must change the selected Account id because the array's ids were changed
    //index to delete cannot be === to the selected account
    const selectedAccountId = getSelectedAccountId();
    if (selectedAccountId != null && selectedAccountId > indexToLogOut)
      SelectAccount(selectedAccountId - 1);
    try {
      userDataStorage.update('auth.accountList', list);
      resolve(list);
    } catch (err: any) {
      reject(err);
      throw new Error(err);
    }
  });
}
function addAccountToList(userToAdd: MinecraftAccount): MinecraftAccount[] {
  //to get the new account id: [list.length -1] because the account is added to the end of array
  const list: MinecraftAccount[] = getAccountList();
  list.push(userToAdd);
  return list;
}
function removeAccountToList(indexToDelete: number): MinecraftAccount[] {
  const list: MinecraftAccount[] = getAccountList();
  list.splice(indexToDelete, 1);
  return list;
}
export interface MinecraftAccount {
  readonly mcToken: string;
  readonly profile: MCProfile | undefined;
  readonly xuid: string;
  readonly exp: number;
}
function ConstructMinecraftUser(Minecraft: MinecraftAccount): MinecraftAccount {
  return <MinecraftAccount>{
    mcToken: Minecraft.mcToken,
    profile: Minecraft.profile,
    xuid: Minecraft.xuid,
    exp: Minecraft.exp,
  };
}
