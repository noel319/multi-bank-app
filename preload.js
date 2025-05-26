const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Python backend communication
  callPython: (args) => ipcRenderer.invoke('call-python', args),
  
  // External links
  openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
  
  // Dialog methods
  showErrorDialog: (options) => ipcRenderer.invoke('show-error-dialog', options),
  showMessageDialog: (options) => ipcRenderer.invoke('show-message-dialog', options),
  
  banking: {
    // Home page data
    getHomeData: () => ipcRenderer.invoke('call-python', {
      action: 'get_home_data'
    }),
    
    // Bank management
    addBank: (bankData) => ipcRenderer.invoke('call-python', {
      action: 'add_bank',
      payload: bankData
    }),
    
    updateBank: (bankData) => ipcRenderer.invoke('call-python', {
      action: 'update_bank',
      payload: bankData
    }),
    
    deleteBank: (bankId) => ipcRenderer.invoke('call-python', {
      action: 'delete_bank',
      payload: { bank_id: bankId }
    }),
    
    // Bank details
    getBankDetails: (bankId) => ipcRenderer.invoke('call-python', {
      action: 'get_bank_details',
      payload: { bank_id: bankId }
    }),
    
    // Transaction management
    getTransactions: (bankId, filters) => ipcRenderer.invoke('call-python', {
      action: 'get_transactions',
      payload: { bank_id: bankId, ...filters }
    }),
    
    fetchTransactions: (bankId) => ipcRenderer.invoke('call-python', {
      action: 'fetch_transactions',
      payload: { bank_id: bankId }
    }),
    
    // Personal account
    updatePersonalBalance: (balance) => ipcRenderer.invoke('call-python', {
      action: 'update_personal_balance',
      payload: { balance }
    }),
    
    // Analytics
    getAnalytics: (period) => ipcRenderer.invoke('call-python', {
      action: 'get_analytics',
      payload: { period }
    })
  },
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
  // Database operations
  database: {
    backup: () => ipcRenderer.invoke('call-python', {
      action: 'backup_database'
    }),
    
    restore: (filePath) => ipcRenderer.invoke('call-python', {
      action: 'restore_database',
      payload: { file_path: filePath }
    }),
    
    export: (format, filters) => ipcRenderer.invoke('call-python', {
      action: 'export_data',
      payload: { format, ...filters }
    })
  },
  
  // Settings
  settings: {
    get: (key) => ipcRenderer.invoke('call-python', {
      action: 'get_setting',
      payload: { key }
    }),
    
    set: (key, value) => ipcRenderer.invoke('call-python', {
      action: 'set_setting',
      payload: { key, value }
    }),
    
    getAll: () => ipcRenderer.invoke('call-python', {
      action: 'get_all_settings'
    })
  },
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File operations (if needed)
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  saveFile: (options) => ipcRenderer.invoke('save-file', options)
});