const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  
  callPython: (action, payload = {}) => ipcRenderer.invoke('call-python', { action, payload }),


  openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
  showErrorDialog: (title, content) => ipcRenderer.invoke('show-error-dialog', { title, content }),
  showMessageDialog: (options) => ipcRenderer.invoke('show-message-dialog', options), 

  
  onBankDataUpdated: (callback) => ipcRenderer.on('bank-data-updated', (_event, value) => callback(value)),
  removeBankDataUpdatedListener: (callback) => ipcRenderer.removeListener('bank-data-updated', callback),

  
  onGoogleAuthResponse: (callback) => ipcRenderer.on('google-auth-response', (_event, value) => callback(value)),
  removeGoogleAuthResponseListener: (callback) => ipcRenderer.removeListener('google-auth-response', callback),
});