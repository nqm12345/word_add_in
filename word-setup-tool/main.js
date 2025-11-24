const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Create window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 800,
    minHeight: 500,
    resizable: true,
    frame: true,
    backgroundColor: '#1e1e2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);
}

// Check if hosts file has domain mapping
function checkHostsFile() {
  try {
    const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    const content = fs.readFileSync(hostsPath, 'utf8');
    return content.includes('wordserver.local');
  } catch (error) {
    return false;
  }
}

// Add domain to hosts file
function setupHostsFile() {
  try {
    const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    const entry = '\n127.0.0.1   wordserver.local\n';
    
    // Check if already exists
    const content = fs.readFileSync(hostsPath, 'utf8');
    if (content.includes('wordserver.local')) {
      return true; // Already exists
    }
    
    // Add entry
    fs.appendFileSync(hostsPath, entry);
    return true;
  } catch (error) {
    console.error('Hosts file error:', error);
    return false;
  }
}

// Check if Word Desktop is already configured
function checkWordSetup() {
  try {
    // Check Registry for Trusted Location
    const checkCmd = 'reg query "HKCU\\Software\\Microsoft\\Office\\16.0\\Word\\Security\\Trusted Locations\\Location99" /v Path 2>nul';
    execSync(checkCmd);
    return true; // Already configured
  } catch (error) {
    return false; // Not configured
  }
}

// Auto setup mkcert and generate certificates
async function setupMkcert() {
  return new Promise((resolve) => {
    try {
      const isDev = !app.isPackaged;
      const mkcertPath = isDev 
        ? path.join(__dirname, 'mkcert.exe')
        : path.join(process.resourcesPath, 'mkcert.exe');
      
      if (!fs.existsSync(mkcertPath)) {
        resolve({ 
          success: false, 
          message: 'Không tìm thấy mkcert.exe' 
        });
        return;
      }

      const certsDir = isDev
        ? path.join(__dirname, '..', 'certs')
        : path.join(process.resourcesPath, 'certs');

      // Send status update
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          step: 'mkcert-install',
          message: 'Đang cài đặt mkcert CA...'
        });
      }

      // Step 1: Install mkcert CA
      exec(`"${mkcertPath}" -install`, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, message: 'Lỗi cài đặt mkcert CA: ' + error.message });
          return;
        }

        // Step 2: Generate certificates
        if (mainWindow) {
          mainWindow.webContents.send('update-status', {
            step: 'generate-certs',
            message: 'Đang tạo SSL certificates...'
          });
        }

        // Delete old certificates
        const oldCrt = path.join(certsDir, 'wordserver.local.crt');
        const oldKey = path.join(certsDir, 'wordserver.local.key');
        
        if (fs.existsSync(oldCrt)) fs.unlinkSync(oldCrt);
        if (fs.existsSync(oldKey)) fs.unlinkSync(oldKey);

        // Generate new certificates
        const generateCmd = `cd /d "${certsDir}" && "${mkcertPath}" wordserver.local localhost 127.0.0.1 ::1`;
        
        exec(generateCmd, (error, stdout, stderr) => {
          if (error) {
            resolve({ success: false, message: 'Lỗi tạo certificates: ' + error.message });
            return;
          }

          // Rename files
          try {
            const files = fs.readdirSync(certsDir);
            const pemFiles = files.filter(f => f.endsWith('.pem'));
            
            pemFiles.forEach(file => {
              const fullPath = path.join(certsDir, file);
              let newName;
              
              if (file.includes('-key')) {
                newName = 'wordserver.local.key';
              } else {
                newName = 'wordserver.local.crt';
              }
              
              const newPath = path.join(certsDir, newName);
              fs.renameSync(fullPath, newPath);
            });

            resolve({ 
              success: true, 
              message: 'SSL Certificates đã được tạo và cài đặt!\n\n' +
                       '✓ mkcert CA installed\n' +
                       '✓ Certificates generated\n' +
                       '✓ Browser sẽ tự động trust (không cần accept SSL)!'
            });
          } catch (err) {
            resolve({ success: false, message: 'Lỗi rename files: ' + err.message });
          }
        });
      });

    } catch (error) {
      resolve({ 
        success: false, 
        message: 'Lỗi setup mkcert: ' + error.message 
      });
    }
  });
}

// Auto setup Word Desktop
async function autoSetupWord() {
  return new Promise((resolve) => {
    try {
      const isDev = !app.isPackaged;
      const scriptPath = isDev 
        ? path.join(__dirname, 'ADD_TRUSTED_LOCATION.ps1')
        : path.join(process.resourcesPath, 'ADD_TRUSTED_LOCATION.ps1');
      
      if (!fs.existsSync(scriptPath)) {
        resolve({ 
          success: false, 
          message: 'Không tìm thấy script setup.\n\nVui lòng chạy script ADD_TRUSTED_LOCATION.ps1 thủ công.' 
        });
        return;
      }

      // Setup hosts file first
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          step: 'setup-hosts',
          message: 'Đang cấu hình hosts file...'
        });
      }

      const hostsSetup = setupHostsFile();
      if (!hostsSetup) {
        resolve({ 
          success: false, 
          message: 'Không thể cập nhật hosts file.\n\nVui lòng chạy app với quyền Administrator.' 
        });
        return;
      }

      // Update status
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          step: 'closing-word',
          message: 'Đang đóng Microsoft Word...'
        });
      }

      // Kill all Word processes
      exec('taskkill /F /IM WINWORD.EXE', (err) => {
        // Continue even if no Word process found
        
        if (mainWindow) {
          mainWindow.webContents.send('update-status', {
            step: 'updating-registry',
            message: 'Đang cập nhật Registry...'
          });
        }

        // Run PowerShell script
        const ps = spawn('powershell.exe', [
          '-ExecutionPolicy', 'Bypass',
          '-File', scriptPath
        ], { stdio: 'pipe' });

        let output = '';
        ps.stdout.on('data', (data) => {
          output += data.toString();
          console.log(`Script: ${data}`);
        });

        ps.stderr.on('data', (data) => {
          console.error(`Script Error: ${data}`);
        });

        ps.on('close', (code) => {
          if (code === 0) {
            if (mainWindow) {
              mainWindow.webContents.send('update-status', {
                step: 'refreshing',
                message: 'Đang refresh Explorer...'
              });
            }

            // Refresh Explorer to apply changes
            exec('taskkill /F /IM explorer.exe && start explorer.exe', () => {
              setTimeout(() => {
                resolve({ 
                  success: true, 
                  message: 'Setup Word Desktop hoàn tất!\n\n✅ Cấu hình hosts file (wordserver.local)\n✅ Tắt Protected View\n✅ Enable Network Locations\n✅ Thêm Trusted Location\n\nBạn có thể mở Word và sử dụng ngay!' 
                });
              }, 2000);
            });
          } else {
            resolve({ 
              success: false, 
              message: 'Setup thất bại.\n\nVui lòng:\n1. Chạy app với quyền Administrator\n2. Hoặc chạy script ADD_TRUSTED_LOCATION.ps1 thủ công' 
            });
          }
        });
      });
    } catch (error) {
      resolve({ 
        success: false, 
        message: 'Lỗi: ' + error.message 
      });
    }
  });
}

// IPC Handlers
ipcMain.handle('setup-mkcert', async () => {
  return await setupMkcert();
});

ipcMain.handle('setup-word', async () => {
  return await autoSetupWord();
});

// Main logic
app.whenReady().then(async () => {
  createWindow();

  // Wait for window to be ready
  mainWindow.webContents.on('did-finish-load', async () => {
    // Check if already configured
    mainWindow.webContents.send('update-status', {
      step: 'checking',
      message: 'Đang kiểm tra cấu hình Word Desktop...'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const isWordConfigured = checkWordSetup();
    const isHostsConfigured = checkHostsFile();

    if (isWordConfigured && isHostsConfigured) {
      // Already configured
      mainWindow.webContents.send('setup-complete', {
        success: true,
        alreadyConfigured: true,
        message: 'Word Desktop đã được cấu hình!\n\n✅ Hosts file OK\n✅ Word Registry OK\n\nKhông cần setup lại.\n\nBạn có thể đóng cửa sổ này.'
      });
    } else {
      // Need to setup - Run mkcert first, then Word setup
      
      // Step 1: Setup mkcert
      mainWindow.webContents.send('update-status', {
        step: 'mkcert',
        message: '🔐 Đang setup SSL certificates...'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const mkcertResult = await setupMkcert();

      if (!mkcertResult.success) {
        mainWindow.webContents.send('setup-complete', {
          success: false,
          alreadyConfigured: false,
          message: '❌ Lỗi setup mkcert:\n\n' + mkcertResult.message
        });
        return;
      }

      // Step 2: Setup Word Desktop
      mainWindow.webContents.send('update-status', {
        step: 'word',
        message: '⚙️ Đang setup Word Desktop...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const wordResult = await autoSetupWord();

      mainWindow.webContents.send('setup-complete', {
        success: wordResult.success,
        alreadyConfigured: false,
        message: wordResult.success 
          ? '✅ SETUP HOÀN TẤT!\n\n' +
            '🔐 SSL Certificates: OK\n' +
            '📝 Hosts file: OK\n' +
            '⚙️ Word Registry: OK\n\n' +
            '⚠️ QUAN TRỌNG:\n' +
            '1. RESTART COMPUTER\n' +
            '2. Restart servers (API + WebDAV)\n' +
            '3. Mở browser - KHÔNG CẦN ACCEPT SSL nữa!\n' +
            '4. Upload & Edit - Tất cả hoạt động!\n\n' +
            '🎉 Browser sẽ TỰ ĐỘNG trust SSL!'
          : '❌ Lỗi setup:\n\n' + wordResult.message
      });
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
