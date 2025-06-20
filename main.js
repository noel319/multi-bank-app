const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { spawn } = require('child_process'); // Add this import

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const PYTHON_EXECUTABLE = isDev 
  ? path.join(__dirname, 'python_backend', 'myenv', 'Scripts', 'python.exe') // Use venv python in dev
  : path.join(process.resourcesPath, 'python_runtime', 'main_handler.exe');

const SCRIPT_PATH = isDev
  ? path.join(__dirname, 'python_backend', 'main_handler.py')
  : path.join(process.resourcesPath, 'python_runtime', 'main_handler.exe');

// Fallback to system python if venv doesn't exist
const getDeployedPython = () => {
  const venvPython = path.join(__dirname, 'python_backend', 'myenv', 'Scripts', 'python.exe');
  if (isDev && fsSync.existsSync(venvPython)) {
    return venvPython;
  }
  return isDev ? 'python' : path.join(process.resourcesPath, 'python_runtime', 'main_handler.exe');
};

let mainWindow

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        enableRemoteModule: false,
        webSecurity: true // Always true in production
      },
      icon: isDev 
        ? path.join(__dirname, './app/public', 'icon.ico')
        : path.join(__dirname, 'icon.ico'),
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });
  
    const startUrl = isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, 'app', 'dist', 'index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => (mainWindow = null));

  if (process.platform === 'darwin') {
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  initializeApp();
}

function showErrorDialog(title, content) {
  if (mainWindow) {
    dialog.showErrorBox(title, content);
  } else {
    console.error(`${title}: ${content}`);
  }
}

async function initializeApp() {
  try {
    console.log('Initializing application...');
    
    if (!fsSync.existsSync(SCRIPT_PATH)) {
      console.error('Python script not found at:', SCRIPT_PATH);
      showErrorDialog('Setup Error', 'Python backend not found. Please check your installation.');
      return;
    }

    // Test Python connection
    const response = await callPythonLogic({ action: 'init_db_check' });
    if (response.success) {
      console.log('Database initialized successfully');
    } else {
      console.error('Database initialization failed:', response.error);
      showErrorDialog('Database Error', 'Failed to initialize database: ' + response.error);
    }
  } catch (error) {
    console.error('App initialization error:', error);
    showErrorDialog('Initialization Error', 'Failed to initialize application: ' + error.message);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ---------------------- FIXED PYTHON LOGIC ---------------------- //

async function callPythonLogic({ action, payload = {} }) {
  return new Promise((resolve, reject) => {
    console.log(`[Python] Calling action: ${action} with payload:`, payload);
    
    let pythonProcess;
    
    if (isDev) {
      // Development: use Python script
      const args = [SCRIPT_PATH, action];
      if (Object.keys(payload).length > 0) {
        args.push('--payload', JSON.stringify(payload));
      }
      pythonProcess = spawn(PYTHON_EXECUTABLE, args);
    } else {
      // Production: use compiled executable
      const args = [action];
      if (Object.keys(payload).length > 0) {
        args.push('--payload', JSON.stringify(payload));
      }
      pythonProcess = spawn(PYTHON_EXECUTABLE, args);
    }
    
    let dataString = '';
    let errorString = '';
    
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error(`[Python Error] ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`[Python] Process exited with code: ${code}`);
      
      if (code !== 0) {
        console.error(`[Python] Error output: ${errorString}`);
        resolve({
          success: false,
          error: `Python process failed with code ${code}: ${errorString || 'Unknown error'}`
        });
        return;
      }
      
      try {
        const lines = dataString.trim().split('\n');
        let jsonLine = '';
        
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') || line.startsWith('[')) {
            jsonLine = line;
            break;
          }
        }
        
        if (!jsonLine) {
          console.error(`[Python] No JSON found in output: ${dataString}`);
          resolve({
            success: false,
            error: 'No valid JSON response found',
            raw_output: dataString
          });
          return;
        }
        
        const result = JSON.parse(jsonLine);
        console.log(`[Python] Success response:`, result);
        resolve(result);
        
      } catch (parseError) {
        console.error(`[Python] JSON parse error: ${parseError.message}`);
        console.error(`[Python] Raw output: ${dataString}`);
        resolve({
          success: false,
          error: `Failed to parse Python response: ${parseError.message}`,
          raw_output: dataString
        });
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error(`[Python] Process error: ${error.message}`);
      resolve({
        success: false,
        error: `Failed to start Python process: ${error.message}`
      });
    });
    
    setTimeout(() => {
      pythonProcess.kill();
      resolve({
        success: false,
        error: 'Python process timed out after 30 seconds'
      });
    }, 60000);
  });
}
// ---------------------- IPC HANDLERS ---------------------- //

// File dialog handlers
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  } catch (error) {
    console.error('Error showing open dialog:', error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  } catch (error) {
    console.error('Error showing save dialog:', error);
    return { canceled: true, error: error.message };
  }
});

// Message dialog handlers (MISSING HANDLERS)
ipcMain.handle('show-message-dialog', async (event, options) => {
  try {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
  } catch (error) {
    console.error('Error showing message dialog:', error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('show-error-dialog', async (event, options) => {
  try {
    // For error dialogs, we can use either showErrorBox or showMessageBox
    if (options.title && options.content) {
      // Use showErrorBox for simple error messages
      dialog.showErrorBox(options.title, options.content);
      return { success: true };
    } else {
      // Use showMessageBox for more complex error dialogs
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'error',
        ...options
      });
      return result;
    }
  } catch (error) {
    console.error('Error showing error dialog:', error);
    return { error: error.message };
  }
});

// File system operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    await fs.writeFile(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error writing file:', error);
    return { success: false, error: error.message };
  }
});

// App info handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getAppPath());
ipcMain.handle('is-dev', () => isDev);

// Window control handlers
ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Banking specific handlers
ipcMain.handle('export-transactions', async (event, options) => {
  try {
    const result = await callPythonLogic({ action: 'export_transactions', payload: options });
    return result;
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-transactions', async (event, filePath) => {
  try {
    const result = await callPythonLogic({ action: 'import_transactions', payload: { file_path: filePath } });
    return result;
  } catch (error) {
    console.error('Error importing transactions:', error);
    return { success: false, error: error.message };
  }
});

// Google Sheets specific handlers
ipcMain.handle('connect-google-sheets', async () => {
  try {
    const result = await callPythonLogic({ action: 'connect_google_sheets' });
    
    // Send status update to renderer
    if (mainWindow && result.success) {
      mainWindow.webContents.send('google-sheets-status-changed', {
        connected: true,
        spreadsheetId: result.spreadsheet_id
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error connecting to Google Sheets:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-google-sheets-status', async () => {
  try {
    const result = await callPythonLogic({ action: 'check_google_sheets_status' });
    return result;
  } catch (error) {
    console.error('Error checking Google Sheets status:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sync-transactions-to-sheets', async () => {
  try {
    const result = await callPythonLogic({ action: 'sync_transactions_to_sheets' });
    
    // Send sync complete notification to renderer
    if (mainWindow && result.success) {
      mainWindow.webContents.send('data-sync', {
        type: 'google_sheets',
        success: true,
        message: `Synced ${result.transactions_count || 0} transactions`,
        timestamp: new Date().toISOString()
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error syncing transactions to Google Sheets:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('disconnect-google-sheets', async () => {
  try {
    const result = await callPythonLogic({ action: 'disconnect_google_sheets' });
    
    // Send status update to renderer
    if (mainWindow && result.success) {
      mainWindow.webContents.send('google-sheets-status-changed', {
        connected: false,
        spreadsheetId: null
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error disconnecting from Google Sheets:', error);
    return { success: false, error: error.message };
  }
});

// Enhanced sync with better error handling and notifications
ipcMain.handle('sync-google-sheets-enhanced', async (event, options = {}) => {
  try {
    const startTime = Date.now();
    console.log('[Google Sheets] Starting enhanced sync...');
    
    // First check connection status
    const statusResult = await callPythonLogic({ action: 'check_google_sheets_status' });
    
    if (!statusResult.success || !statusResult.connected) {
      return {
        success: false,
        error: 'Google Sheets not connected. Please connect first.'
      };
    }
    
    // Perform sync
    const syncResult = await callPythonLogic({ 
      action: 'sync_transactions_to_sheets',
      payload: options
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Google Sheets] Sync completed in ${duration}ms`);
    
    // Send detailed sync result to renderer
    if (mainWindow) {
      mainWindow.webContents.send('data-sync', {
        type: 'google_sheets_enhanced',
        success: syncResult.success,
        message: syncResult.success 
          ? `Successfully synced ${syncResult.transactions_count || 0} transactions` 
          : syncResult.error,
        duration,
        timestamp: new Date().toISOString(),
        data: syncResult
      });
    }
    
    return syncResult;
    
  } catch (error) {
    console.error('[Google Sheets] Enhanced sync error:', error);
    return { success: false, error: error.message };
  }
});

// Auto-sync handler (can be called periodically)
ipcMain.handle('auto-sync-google-sheets', async () => {
  try {
    // Check if auto-sync is enabled (you can add this to user preferences)
    const statusResult = await callPythonLogic({ action: 'check_google_sheets_status' });
    
    if (statusResult.success && statusResult.connected) {
      const syncResult = await callPythonLogic({ action: 'sync_transactions_to_sheets' });
      
      if (mainWindow && syncResult.success) {
        // Send quiet notification for auto-sync
        mainWindow.webContents.send('data-sync', {
          type: 'auto_sync',
          success: true,
          message: 'Auto-sync completed',
          timestamp: new Date().toISOString()
        });
      }
      
      return syncResult;
    }
    
    return { success: true, message: 'Google Sheets not connected, skipping auto-sync' };
    
  } catch (error) {
    console.error('Auto-sync error:', error);
    return { success: false, error: error.message };
  }
});

// Enhanced periodic background sync with Google Sheets support
setInterval(async () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Regular background sync
      const result = await callPythonLogic({ action: 'sync_background_data' });
      if (result.success) {
        mainWindow.webContents.send('data-sync', result);
      }
      
      // Auto-sync to Google Sheets if connected (every 10 minutes)
      if (Date.now() % (10 * 60 * 1000) < 5000) { // Rough 10-minute check
        await callPythonLogic({ action: 'auto_sync_google_sheets' });
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}, 5 * 60 * 1000); // every 5 minutes

// Notification handler
ipcMain.handle('show-notification', (event, title, body, options = {}) => {
  try {
    const notification = new Notification({ title, body, ...options });
    notification.show();
    return { success: true };
  } catch (error) {
    console.error('Error showing notification:', error);
    return { success: false, error: error.message };
  }
});

// Dev tools (only in dev)
ipcMain.on('open-dev-tools', () => {
  if (mainWindow && isDev) {
    mainWindow.webContents.openDevTools();
  }
});

// Auto-updater mock
ipcMain.handle('check-for-updates', async () => {
  return { success: true, message: 'No updates available' };
});

// Enhanced Python logic with better error handling
ipcMain.handle('call-python', async (event, args) => {
  const startTime = Date.now();
  try {
    console.log(`[IPC] Starting Python call: ${args.action}`);
    const result = await callPythonLogic(args);
    console.log(`[IPC] Completed in ${Date.now() - startTime}ms: ${args.action}`);
    return result;
  } catch (error) {
    console.error(`[IPC] Failed after ${Date.now() - startTime}ms: ${args.action}`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
});

// Periodic background sync
setInterval(async () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const result = await callPythonLogic({ action: 'sync_background_data' });
      if (result.success) {
        mainWindow.webContents.send('data-sync', result);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}, 5 * 60 * 1000); // every 5 minutes