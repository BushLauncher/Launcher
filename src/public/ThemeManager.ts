import { Themes } from './ThemePublic';

export async function SetTheme(theme: Themes) {
  await window.electron.ipcRenderer.sendMessage('updateData', ({ dataPath: 'interface.theme', value: theme }));
  window.location.reload();
}

export async function getCurrentTheme(): Promise<Themes> {
  const res: Themes | undefined = await window.electron.ipcRenderer.invoke('getData', ({ dataPath: 'interface.theme' }));
  if (res === undefined) {
    await SetTheme(Themes.Dark);
    console.warn('We couldn\'t find ' + res + ' theme !');
    return (Themes.Dark);
  } else return (res as Themes);
}

export function getAllTheme(): string[] {
  return Object.keys(Themes);
}
