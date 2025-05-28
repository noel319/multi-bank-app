const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Development mode detection
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
      webSecurity: !isDev // Disable web security in development for local testing
    },
    icon: path.join(__dirname, './app/public', 'vite.svg'),
    show: false, // Don't show until ready
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Load the React app
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, './app/dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window (optional)
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => (mainWindow = null));

  // Handle window controls on macOS
  if (process.platform === 'darwin') {
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  // Initialize database on startup
  initializeApp();
}

async function initializeApp() {
  try {
    console.log('Initializing application...');
    
    // Check if Python script exists
    if (!fs.existsSync(SCRIPT_PATH)) {
      console.error('Python script not found at:', SCRIPT_PATH);
      showErrorDialog('Setup Error', 'Python backend not found. Please check your installation.');
      return;
    }

    // Initialize database
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

app.whenReady().then(() => {
  createWindow();

  // macOS specific behavior
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
});

// --- IPC Handler for Python Bridge ---
async function callPythonLogic(args) {
  return new Promise((resolve, reject) => {
    const { action, payload = {} } = args;
    console.log(`Calling Python: Action=${action}, Payload=${JSON.stringify(payload).substring(0, 100)}...`);

    // Validate action
    const validActions = [
      'init_db_check', 'register', 'login', 'google_login', 
      'logout', 'check_auth_status', 'refresh_token'
    ];
    
    if (!validActions.includes(action)) {
      reject({ success: false, error: 'Invalid action', action });
      return;
    }

    const pyProcess = spawn(PYTHON_EXECUTABLE, [
      SCRIPT_PATH, 
      action, 
      '--payload', 
      JSON.stringify(payload)
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stdout = '';
    let stderr = '';
    let isResolved = false;

    // Set timeout for long-running processes
    const timeout = setTimeout(() => {
      if (!isResolved) {
        pyProcess.kill();
        reject({ success: false, error: 'Python process timeout', action });
        isResolved = true;
      }
    }, 30000); // 30 second timeout

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pyProcess.on('close', (code) => {
      clearTimeout(timeout);
      
      if (isResolved) return;
      isResolved = true;

      console.log(`Python process exited with code ${code}`);
      if (stdout) console.log('Python stdout:', stdout.substring(0, 500) + (stdout.length > 500 ? '...' : ''));
      if (stderr) console.error('Python stderr:', stderr);

      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          console.error('Failed to parse Python output:', e, stdout);
          reject({ 
            success: false, 
            error: 'Failed to parse Python output', 
            details: stdout,
            action 
          });
        }
      } else {
        reject({ 
          success: false, 
          error: `Python script error (code ${code})`, 
          details: stderr || stdout,
          action 
        });
      }
    });

    pyProcess.on('error', (err) => {
      clearTimeout(timeout);
      
      if (isResolved) return;
      isResolved = true;

      console.error('Failed to start Python process:', err);
      reject({ 
        success: false, 
        error: 'Failed to start Python process', 
        details: err.message,
        action 
      });
    });
  });
}

// --- IPC Handlers ---
ipcMain.handle('call-python', async (event, args) => {
  try {
    return await callPythonLogic(args);
  } catch (error) {
    console.error('Error in call-python IPC handler:', error);
    return error;
  }
});

ipcMain.on('open-external-link', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('show-error-dialog', async (event, { title, content }) => {
  return dialog.showErrorBox(title, content);
});

ipcMain.handle('show-message-dialog', async (event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Helper function to show error dialogs
function showErrorDialog(title, message) {
  if (mainWindow) {
    dialog.showErrorBox(title, message);
  } else {
    console.error(`${title}: ${message}`);
  }
}

// Handle certificate errors in development
if (isDev) {
  app.commandLine.appendSwitch('ignore-certificate-errors');
  app.commandLine.appendSwitch('ignore-ssl-errors');
}

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});