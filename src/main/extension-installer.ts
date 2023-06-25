import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-extension-installer';
export async function installExtensions() {
  await installExtension(REACT_DEVELOPER_TOOLS, {
    loadExtensionOptions: { allowFileAccess: true }
  });
}
