import RenderConsoleManager, { ProcessType } from '../../../../global/RenderConsoleManager';
import { Account } from '../../../../types/AuthPublic';
import LoginPanel, { LoginPanelProps } from './LoginPanel';
import { AuthData } from '../../../../types/Storage';
import { createRoot } from 'react-dom/client';
import { GenericError, isError, KnownAuthErrorType } from '../../../../types/Errors';
import React from 'react';

const console = new RenderConsoleManager('AuthManager', ProcessType.Render);

export default class AuthManager {
  private accountList!: Account[];
  private selected!: number | null;

  constructor() {
    //init var
    this.refreshData().then(() => {
      console.log('coucou ' + this.accountList);
    });
    return this;
  }

  public async findIndex(toFind: Account | string) {
    await this.verifyInnerVars();
    const name = typeof toFind === 'string' ? toFind : toFind.name;
    return this.accountList.findIndex(a => a.name === name);
  }

  public async getAccountList(): Promise<typeof this.accountList> {
    await this.verifyInnerVars();
    return this.accountList;
  }

  public async getSelectedId(): Promise<typeof this.selected> {
    await this.verifyInnerVars();
    return this.selected;
  }

  public async getSelectedAccount(): Promise<Account | null> {
    await this.verifyInnerVars();
    return this.selected !== null ? this.accountList[this.selected] : null;
  }

  /**
   * Request the user to login new account with the login panel,
   *
   * > Will Log-in, Validate, Register, Select the account
   * @public
   * @return The new logged account
   * @throws AuthError
   */
  async LoginNew(panelParameters: Parameters<typeof this.getLogin>) {
    return new Promise<Account>(async (resolve, reject) => {
      //Open login panel
      const response = await this.getLogin(...panelParameters);
      if (isError(response)) {
        console.error(response);
        reject(response);
      } else {
        const account = response as Account;
        //Prevent double account registering
        if (this.accountList.find(a => a.name === account.name) !== undefined) {
          reject(KnownAuthErrorType.UserAlreadyRegistered);
          return;
        }
        //register it + select it
        await this.requestAdd(account);
        //return it
        console.log('User is: ' + account.name);
        resolve(account);
      }
    });
  }

  public async refreshData() {
    const response: AuthData | undefined = await window.electron.ipcRenderer.invoke('Auth:getData', {});
    if (response === undefined) throw new Error('Cannot get auth data'); else {
      this.accountList = response.accountList;
      this.selected = response.selectedAccount;
    }

  }

  public async requestSelect(toSelect: Account): Promise<void>;

  public async requestSelect(toSelect: number): Promise<void>;

  public async requestSelect(toSelect: number | Account) {
    //resolve account
    const index = typeof toSelect === 'object' ? this.getIndex(toSelect) : toSelect;
    return await window.electron.ipcRenderer.invoke('Auth:SelectAccount', { index: index });
  }

  public async requestLogout(toSelect: Account): Promise<void>;

  public async requestLogout(toSelect: number): Promise<void>;

  public async requestLogout(toSelect: number | Account) {
    //resolve account
    const index = typeof toSelect === 'object' ? this.getIndex(toSelect) : toSelect;
    return await window.electron.ipcRenderer.invoke('Auth:LogOut', { index: index });
  }

  private async verifyInnerVars() {
    if (!this.accountList || !this.selected) await this.refreshData();
  }

  private async getLogin(props: Omit<LoginPanelProps, 'resolve'>) {
    return new Promise<Account | GenericError>((resolve) => {
      const container = document.createElement('div');
      const loginPanelRoot = createRoot(container);
      const app = document.getElementById('App');
      loginPanelRoot.render(<LoginPanel {...props} resolve={resolve}/>);
      if (app === null) throw new Error('Cannot get App container'); else app.appendChild(container);
    });
  }

  private async requestAdd(account: Account) {
    await window.electron.ipcRenderer.invoke('Auth:Add', { user: account });
  }

  private getIndex(account: Account): number {
    const index = this.accountList.findIndex(a => a.name === account.name);
    if (index === -1) throw new Error('Cannot find this account in storage: \n' + account);
    else return index;
  }
}
