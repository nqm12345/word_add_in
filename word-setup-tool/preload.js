const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('setupAPI', {
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
  onSetupComplete: (callback) => ipcRenderer.on('setup-complete', (event, data) => callback(data))
});
