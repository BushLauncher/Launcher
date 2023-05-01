import {Theme} from '../../internal/public/ThemePublic';

export function SetTheme(theme: Theme) {
  window.electron.ipcRenderer.sendMessage('updateData', ({ dataPath: 'interface.theme', value: theme }));
  window.location.reload()
}

export function getCurrentTheme(): Promise<Theme> {
  return new Promise<Theme>((resolve, reject) => {
    window.electron.ipcRenderer.invoke('getData', ({ dataPath: 'interface.theme' }))
      .then((res: Theme | undefined) => {
        if (res != undefined) {
          resolve(Theme[res as unknown as Theme]);
        } else {
          resolve(Theme.Dark);
          console.warn("We couldn't find " + res + " theme !");
        }
      }).catch(err => console.error(err));
  });
}

export function getAllTheme(): string[]{
  return Object.keys(Theme)
}
