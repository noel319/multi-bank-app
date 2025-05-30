// Add these IPC handlers to your existing main.js file

const fs = require('fs').promises;
const { Notification } = require('electron');

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
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('is-dev', () => {
  return isDev;
});

// Window control handlers
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Banking specific handlers
ipcMain.handle('export-transactions', async (event, options) => {
  try {
    const result = await callPythonLogic({
      action: 'export_transactions',
      payload: options
    });
    return result;
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-transactions', async (event, filePath) => {
  try {
    const result = await callPythonLogic({
      action: 'import_transactions',
      payload: { file_path: filePath }
    });
    return result;
  } catch (error) {
    console.error('Error importing transactions:', error);
    return { success: false, error: error.message };
  }
});

// Google Sheets sync handler
ipcMain.handle('sync-google-sheets', async (event) => {
  try {
    const result = await callPythonLogic({
      action: 'sync_google_sheets'
    });
    
    // Notify renderer of sync completion
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
    const notification = new Notification({
      title,
      body,
      ...options
    });
    
    notification.show();
    return { success: true };
  } catch (error) {
    console.error('Error showing notification:', error);
    return { success: false, error: error.message };
  }
});

// Development tools
ipcMain.on('open-dev-tools', () => {
  if (mainWindow && isDev) {
    mainWindow.webContents.openDevTools();
  }
});

// Auto-updater events (if you plan to implement auto-updates)
ipcMain.handle('check-for-updates', async () => {
  // Implement auto-updater logic here if needed
  return { success: true, message: 'No updates available' };
});

// Enhanced Python logic caller with better error handling
async function callPythonLogicEnhanced(args) {
  try {
    const result = await callPythonLogic(args);
    
    // Log successful operations
    console.log(`Python operation '${args.action}' completed successfully`);
    
    return result;
  } catch (error) {
    // Enhanced error logging
    console.error(`Python operation '${args.action}' failed:`, error);
    
    // Show error notification to user if needed
    if (mainWindow) {
      const notification = new Notification({
        title: 'Operation Failed',
        body: `Failed to execute ${args.action}: ${error.message || 'Unknown error'}`
      });
      notification.show();
    }
    
    throw error;
  }
}

// Enhanced IPC handler with logging
ipcMain.handle('call-python', async (event, args) => {
  const startTime = Date.now();
  
  try {
    console.log(`[IPC] Starting Python call: ${args.action}`);
    const result = await callPythonLogic(args);
    
    const duration = Date.now() - startTime;
    console.log(`[IPC] Python call completed in ${duration}ms: ${args.action}`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[IPC] Python call failed after ${duration}ms: ${args.action}`, error);
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      details: error.details || 'No additional details available'
    };
  }
});

// Periodic data sync (optional - runs every 5 minutes)
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
}, 5 * 60 * 1000); // 5 minutes