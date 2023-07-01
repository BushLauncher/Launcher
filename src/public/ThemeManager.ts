import { Theme } from './ThemePublic';

export async function SetTheme(theme: Theme) {
  await window.electron.ipcRenderer.sendMessage('updateData', ({ dataPath: 'interface.theme', value: theme }));
  window.location.reload();
}

export async function getCurrentTheme(): Promise<Theme> {
  const res: Theme | undefined = await window.electron.ipcRenderer.invoke('getData', ({ dataPath: 'interface.theme' }));
  if (res === undefined) {
    await SetTheme(Theme.Dark);
    console.warn('We couldn\'t find ' + res + ' theme !');
    return (Theme.Dark);
  } else return (res as Theme);
}

export function getAllTheme(): string[] {
  return Object.keys(Theme);
}
