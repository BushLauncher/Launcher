// @ts-ignore
window.electron.ipcRenderer.on('PreLoad:setText', (val: { text: string }) => {
  const text = document.querySelector('#state');
  if (text === null) console.error('Cannot find #state text html element');
  else text.innerHTML = val.text;
});

window.version.app().then(res => {
  const elements = [document.querySelector('.toReplace[data-type="app-version"]')];
  for (const e of elements) {
    if (e) e.innerHTML = res;
  }
});
