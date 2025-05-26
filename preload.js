const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Python backend communication
  callPython: (args) => ipcRenderer.invoke('call-python', args),
  
  // External links
  openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
  
  // Dialog methods
  showErrorDialog: (options) => ipcRenderer.invoke('show-error-dialog', options),
  showMessageDialog: (options) => ipcRenderer.invoke('show-message-dialog', options),
  
  // Auth-specific methods (optional convenience methods)
  auth: {
    login: (email, password) => ipcRenderer.invoke('call-python', {
      action: 'login',
      payload: { email, password }
    }),
    
    googleLogin: (credential) => ipcRenderer.invoke('call-python', {
      action: 'google_login',
      payload: { credential }
    }),
    
    register: (email, password, name) => ipcRenderer.invoke('call-python', {
      action: 'register',
      payload: { email, password, name }
    }),
    
    logout: (token) => ipcRenderer.invoke('call-python', {
      action: 'logout',
      payload: { token }
    }),
    
    checkStatus: () => ipcRenderer.invoke('call-python', {
      action: 'check_auth_status'
    }),
    
    refreshToken: (token) => ipcRenderer.invoke('call-python', {
      action: 'refresh_token',
      payload: { token }
    })
  },
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File operations (if needed)
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  saveFile: (options) => ipcRenderer.invoke('save-file', options)
});