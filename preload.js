const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Python backend communication
  callPython: (args) => ipcRenderer.invoke('call-python', args),
  
  // Dialog methods
  showErrorDialog: (options) => ipcRenderer.invoke('show-error-dialog', options),
  showMessageDialog: (options) => ipcRenderer.invoke('show-message-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // File system operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  
  // External links
  openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
  
  // App info and controls
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Banking specific operations
  exportTransactions: (options) => ipcRenderer.invoke('export-transactions', options),
  importTransactions: (filePath) => ipcRenderer.invoke('import-transactions', filePath),
  
  // Google Sheets operations (enhanced)
  connectGoogleSheets: () => ipcRenderer.invoke('connect-google-sheets'),
  checkGoogleSheetsStatus: () => ipcRenderer.invoke('check-google-sheets-status'),
  syncTransactionsToSheets: () => ipcRenderer.invoke('sync-transactions-to-sheets'),
  disconnectGoogleSheets: () => ipcRenderer.invoke('disconnect-google-sheets'),
  syncGoogleSheets: () => ipcRenderer.invoke('sync-google-sheets'),
  autoSyncGoogleSheets: () => ipcRenderer.invoke('auto-sync-google-sheets'),
  syncGoogleSheetsEnhanced: (options) => ipcRenderer.invoke('sync-google-sheets-enhanced', options),
  
  // Notification system
  showNotification: (title, body, options) => ipcRenderer.invoke('show-notification', title, body, options),
  
  // Development tools (only available in dev mode)
  isDev: () => ipcRenderer.invoke('is-dev'),
  openDevTools: () => ipcRenderer.send('open-dev-tools'),
  
  // Event listeners for app updates
  onAppUpdate: (callback) => ipcRenderer.on('app-update', callback),
  onDataSync: (callback) => ipcRenderer.on('data-sync', callback),
  onGoogleSheetsStatusChanged: (callback) => ipcRenderer.on('google-sheets-status-changed', callback),
  
  // Remove event listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Google Sheets specific event listeners
  removeGoogleSheetsListeners: () => {
    ipcRenderer.removeAllListeners('google-sheets-status-changed');
    ipcRenderer.removeAllListeners('data-sync');
  }
});