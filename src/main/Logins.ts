import { Account, AuthProvider, MSAccount } from '../types/AuthPublic';
import { AuthError, KnownAuthErrorType } from '../types/Errors';
import { Auth, Minecraft, Xbox } from 'msmc';
import { getAccount } from './AuthModule';
import ConsoleManager, { ProcessType } from '../global/ConsoleManager';

const console = new ConsoleManager('Logins Manager', ProcessType.Internal);


////Microsoft (Xbox)
const msmc = new Auth('login');
msmc.on('load', (asset, message) =>
  console.log(`[Auth Provider (msmc)] ${asset}: ${message}`)
);

export async function MSLogin(): Promise<Account<MSAccount>> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await msmc.launch('electron');
      resolve(await xboxToUser(res));
    } catch (err) {
      if (err == 'error.gui.closed') reject(KnownAuthErrorType.ClosedByUser);
      else reject(err);
    }
  });
}

export function xboxToUser(xbox: Xbox): Promise<Account<MSAccount>> {
  return new Promise((resolve, reject) => {
    xbox.getMinecraft()
      .then((MinecraftLoggedUser: Minecraft) => {
        if (MinecraftLoggedUser.validate()) {
          if (MinecraftLoggedUser.profile !== undefined) {
            const user: Account<MSAccount> =
              {
                name: MinecraftLoggedUser.profile.name,
                provider: AuthProvider.Microsoft,
                data: {
                  mcToken: MinecraftLoggedUser.mcToken,
                  profile: MinecraftLoggedUser.profile,
                  xuid: MinecraftLoggedUser.xuid,
                  exp: MinecraftLoggedUser.exp,
                  createdDate: new Date().getTime(),
                  msToken: xbox.msToken
                }
              };
            console.log(`Logged new Account: ${user.name}`);
            resolve(user);
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

export async function RefreshMSAccount(account: Account<MSAccount>): Promise<Account<MSAccount> | AuthError> {
  const refresh_token = account.data.msToken.refresh_token;
  return msmc.refresh(refresh_token)
    .then(async res => await xboxToUser(res))
    .catch(err => {
      console.log('We couldn\'t refresh account, ', err);
      return err;
    });
}
