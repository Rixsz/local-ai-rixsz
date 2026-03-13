const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onOAuthCallback: (callback) => ipcRenderer.on('oauth-callback', (event, url) => callback(url))
});
