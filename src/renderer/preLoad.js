window.electron.ipcRenderer.on('PreLoad:setText', (val) => {
  document.querySelector('#state').innerHTML = val.text;
});

window.version.app().then(res => {
  const elements = [document.querySelector('.toReplace[data-type="app-version"]')];
  for (const e of elements) {
    if (e) e.innerText = res;
  }
});

