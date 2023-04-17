const { ipcRenderer } = require('electron')
const prefix = '[Renderer]: '

export function isOnline() {
  return navigator.onLine
}
