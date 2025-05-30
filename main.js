const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { spawn } = require('child_process'); // Add this import

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const PYTHON_EXECUTABLE = isDev ? 'python' : path.join(process.resourcesPath, 'python_runtime', 'python');
const SCRIPT_PATH = isDev
  ? path.join(__dirname, 'python_backend', 'main_handler.py')
  : path.join(process.resourcesPath, 'app.asar.unpacked', 'python_backend', 'main_handler.py');

let mainWindow;

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
      webSecurity: !isDev
    },
    icon: path.join(__dirname, './app/public', 'vite.svg'),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, './app/dist/index.html')}`;

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
    
    // Prepare arguments for Python script
    const args = [SCRIPT_PATH, action];
    
    // Add payload if provided
    if (Object.keys(payload).length > 0) {
      args.push('--payload', JSON.stringify(payload));
    }
    
    console.log(`[Python] Executing: ${PYTHON_EXECUTABLE} ${args.join(' ')}`);
    
    const pythonProcess = spawn(PYTHON_EXECUTABLE, args);
    
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
        // Split the output by lines and find the last JSON line
        const lines = dataString.trim().split('\n');
        let jsonLine = '';
        
        // Look for the last line that looks like JSON (starts with { or [)
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
    
    // Set timeout to prevent hanging
    setTimeout(() => {
      pythonProcess.kill();
      resolve({
        success: false,
        error: 'Python process timed out after 30 seconds'
      });
    }, 30000);
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

// Google Sheets sync handler
ipcMain.handle('sync-google-sheets', async () => {
  try {
    const result = await callPythonLogic({ action: 'sync_google_sheets' });
    if (mainWindow) {
      mainWindow.webContents.send('data-sync', result);
    }
    return result;
  } catch (error) {
    console.error('Error syncing Google Sheets:', error);
    return { success: false, error: error.message };
  }
});

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