const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const bankapp = require('multi-bank-app'); 


const PYTHON_EXECUTABLE = bankapp ? 'python' : path.join(process.resourcesPath, 'python_runtime', 'python'); // Example for bundled python
const SCRIPT_PATH = bankapp
  ? path.join(__dirname, 'python_backend', 'main_handler.py')
  : path.join(process.resourcesPath, 'app.asar.unpacked', 'python_backend', 'main_handler.py'); // Adjust if python_backend is outside asar

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, 
      nodeIntegration: false, 
    },
    icon: path.join(__dirname, './app/public', 'vite.svg') 
  });

  // Load the React app
  const startUrl = bankapp
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, './app/dist/index.html')}`; 

  mainWindow.loadURL(startUrl);

  if (bankapp) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => (mainWindow = null));

  
  callPythonLogic({ action: 'init_db_check' }) // A dummy action to ensure DB is set up
    .then(response => console.log('DB Init Check:', response.success ? 'OK' : response.error))
    .catch(err => console.error('DB Init Check Error:', err));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC Handler for Python Bridge ---
async function callPythonLogic(args) {
  return new Promise((resolve, reject) => {
    const { action, payload = {} } = args;
    console.log(`Calling Python: Action=${action}, Payload=${JSON.stringify(payload).substring(0,100)}...`);

    const pyProcess = spawn(PYTHON_EXECUTABLE, [SCRIPT_PATH, action, '--payload', JSON.stringify(payload)]);

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (data) => { stdout += data.toString(); });
    pyProcess.stderr.on('data', (data) => { stderr += data.toString(); });

    pyProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      if (stdout) console.log('Python stdout:', stdout.substring(0, 200) + (stdout.length > 200 ? '...' : ''));
      if (stderr) console.error('Python stderr:', stderr);

      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          console.error('Failed to parse Python output:', e, stdout);
          reject({ success: false, error: 'Failed to parse Python output', details: stdout });
        }
      } else {
        reject({ success: false, error: `Python script error (code ${code})`, details: stderr || stdout });
      }
    });
    pyProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      reject({ success: false, error: 'Failed to start Python process.', details: err.message });
    });
  });
}

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

