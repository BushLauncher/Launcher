import RenderConsoleManager, { ProcessType } from '../../../../global/RenderConsoleManager';
import { Account } from '../../../../types/AuthPublic';
import LoginPanel, { LoginPanelProps } from './LoginPanel';
import { AuthData } from '../../../../types/Storage';
import { createRoot } from 'react-dom/client';
import { GenericError, isError } from '../../../../types/Errors';
import React from 'react';

const console = new RenderConsoleManager('AuthManager', ProcessType.Render);

export default class AuthManager {
  accountList!: Account[];
  selected!: number | null;

  constructor() {
    //init var
    this.refreshData().then(() => {
      console.log('coucou ' + this.accountList);
    });
  }

  public getSelected(): Account | null {
    return this.selected !== null ? this.accountList[this.selected] : null;
  }

  async LoginNew() {
    return new Promise<Account>(async (resolve, reject) => {
      //Open login panel
      const response = await this.getLogin({ closable: false });
      if (isError(response)) {
        console.error(response);
        reject(response);
      } else {
        const account = response as Account;
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

  private async getLogin(props: Omit<LoginPanelProps, 'resolve'>) {
    return new Promise<Account | GenericError>((resolve) => {
      const container = document.createElement('div');
      const loginPanelRoot = createRoot(container);
      loginPanelRoot.render(<LoginPanel {...props} resolve={resolve} />);
      const app = document.getElementById('App');
      if (app === null) throw new Error('Cannot get App container'); else app.appendChild(container);
    });
  }

  private async requestAdd(account: Account) {
    await window.electron.ipcRenderer.invoke('Auth:Add', { user: account });
  }

  private async requestSelect(toSelect: Account): Promise<void>;

  private async requestSelect(toSelect: number): Promise<void>;

  private async requestSelect(toSelect: number | Account) {
    //resolve account
    const index = typeof toSelect === 'object' ? this.findIndex(toSelect) : toSelect;
    return await window.electron.ipcRenderer.invoke('Auth:SelectAccount', { index: index });
  }

  private findIndex(account: Account): number {
    const index = this.accountList.indexOf(account);
    if (index === -1) throw new Error('Cannot find this account in storage: \n' + account); else return index;
  }
}
