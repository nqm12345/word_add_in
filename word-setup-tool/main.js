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

// Auto setup mkcert and generate certificates (with timeout to prevent hanging)
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

      // Always use the project root for certs
      // Development: word-setup-tool/../certs
      // Production: <exe location>/../../certs (exe is in word-setup-tool/dist/)
      const certsDir = isDev
        ? path.join(__dirname, '..', 'certs')
        : path.join(path.dirname(process.execPath), '..', '..', 'certs');

      // Create certs directory if it doesn't exist
      if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
      }

      // Check if certificates already exist
      const crtPath = path.join(certsDir, 'wordserver.local.crt');
      const keyPath = path.join(certsDir, 'wordserver.local.key');
      
      if (fs.existsSync(crtPath) && fs.existsSync(keyPath)) {
        resolve({ 
          success: true, 
          message: 'SSL Certificates đã tồn tại!\n\n✓ Certificates: OK\n✓ Không cần tạo lại!',
          alreadyExists: true
        });
        return;
      }

      // Send status update
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          step: 'mkcert-install',
          message: 'Đang cài đặt mkcert CA (có thể hiện popup UAC)...'
        });
      }

      // Timeout handler (30 seconds)
      const timeout = setTimeout(() => {
        resolve({ 
          success: false, 
          message: 'Timeout cài mkcert CA.\n\n⚠️ Vui lòng chạy THỦ CÔNG:\n\n' +
                   'PowerShell as Admin:\n' +
                   'cd word-setup-tool\n' +
                   '.\\mkcert.exe -install\n' +
                   '.\\mkcert.exe -cert-file ..\\certs\\wordserver.local.crt -key-file ..\\certs\\wordserver.local.key wordserver.local localhost 127.0.0.1 ::1',
          timeout: true 
        });
      }, 30000);

      // Step 1: Install mkcert CA
      exec(`"${mkcertPath}" -install`, { timeout: 25000 }, (error, stdout, stderr) => {
        if (error) {
          clearTimeout(timeout);
          resolve({ 
            success: false, 
            message: 'Lỗi cài mkcert CA.\n\n⚠️ Vui lòng chạy THỦ CÔNG:\n\n' +
                     'PowerShell as Admin:\n' +
                     '.\\mkcert.exe -install' 
          });
          return;
        }

        // Step 2: Generate certificates
        if (mainWindow) {
          mainWindow.webContents.send('update-status', {
            step: 'generate-certs',
            message: 'Đang tạo SSL certificates...'
          });
        }

        // Generate certificates with proper filenames directly
        const generateCmd = `"${mkcertPath}" -cert-file "${crtPath}" -key-file "${keyPath}" wordserver.local localhost 127.0.0.1 ::1`;
        
        exec(generateCmd, { timeout: 15000 }, (error, stdout, stderr) => {
          clearTimeout(timeout);
          
          if (error) {
            resolve({ 
              success: false, 
              message: 'Lỗi tạo certificates.\n\n⚠️ Vui lòng chạy THỦ CÔNG:\n\n' +
                       'PowerShell as Admin:\n' +
                       '.\\mkcert.exe -cert-file ..\\certs\\wordserver.local.crt -key-file ..\\certs\\wordserver.local.key wordserver.local localhost 127.0.0.1 ::1' 
            });
            return;
          }

          // Verify certificates were created
          if (fs.existsSync(crtPath) && fs.existsSync(keyPath)) {
            resolve({ 
              success: true, 
              message: 'SSL Certificates đã được tạo!\n\n' +
                       '✓ mkcert CA installed\n' +
                       '✓ wordserver.local.crt\n' +
                       '✓ wordserver.local.key\n' +
                       '✓ Vị trí: certs/ (bên ngoài word-setup-tool)'
            });
          } else {
            resolve({ 
              success: false, 
              message: 'Không tìm thấy certificates sau khi tạo.\n\nVui lòng kiểm tra thư mục certs/' 
            });
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
            // Script completed successfully - no need to refresh Explorer
            resolve({ 
              success: true, 
              message: 'Setup Word Desktop hoàn tất!\n\n✅ Cấu hình hosts file (wordserver.local)\n✅ Tắt Protected View\n✅ Enable Network Locations\n✅ Thêm Trusted Location\n\n⚠️ VUI LÒNG RESTART MÁY để áp dụng thay đổi!' 
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

// Check if SSL certificates exist
function checkCertificates() {
  const isDev = !app.isPackaged;
  const certsDir = isDev
    ? path.join(__dirname, '..', 'certs')
    : path.join(path.dirname(process.execPath), '..', '..', 'certs');
  
  const crtPath = path.join(certsDir, 'wordserver.local.crt');
  const keyPath = path.join(certsDir, 'wordserver.local.key');
  
  return fs.existsSync(crtPath) && fs.existsSync(keyPath);
}

// Main logic
app.whenReady().then(async () => {
  createWindow();

  // Wait for window to be ready
  mainWindow.webContents.on('did-finish-load', async () => {
    // Check if already configured
    mainWindow.webContents.send('update-status', {
      step: 'checking',
      message: 'Đang kiểm tra cấu hình...'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const isWordConfigured = checkWordSetup();
    const isHostsConfigured = checkHostsFile();
    const isCertsConfigured = checkCertificates();

    if (isWordConfigured && isHostsConfigured && isCertsConfigured) {
      // All already configured
      mainWindow.webContents.send('setup-complete', {
        success: true,
        alreadyConfigured: true,
        message: '✅ TẤT CẢ ĐÃ ĐƯỢC CẤU HÌNH!\n\n' +
                 '✅ Hosts file: OK\n' +
                 '✅ Word Registry: OK\n' +
                 '✅ SSL Certificates: OK\n\n' +
                 'Không cần setup lại.\n' +
                 'Bạn có thể đóng cửa sổ này và chạy servers.'
      });
    } else {
      // Need to setup
      let wordResult = { success: true };
      let mkcertResult = { success: true };
      
      // Step 1: Setup Word (hosts + registry)
      if (!isWordConfigured || !isHostsConfigured) {
        mainWindow.webContents.send('update-status', {
          step: 'word',
          message: '⚙️ [1/2] Đang setup Word Desktop...'
        });

        await new Promise(resolve => setTimeout(resolve, 500));
        wordResult = await autoSetupWord();
      }

      // Step 2: Setup mkcert (CA + certificates)
      if (!isCertsConfigured && wordResult.success) {
        mainWindow.webContents.send('update-status', {
          step: 'mkcert',
          message: '🔐 [2/2] Đang setup SSL Certificates...\n(Có thể hiện popup UAC, vui lòng click Yes)'
        });

        await new Promise(resolve => setTimeout(resolve, 500));
        mkcertResult = await setupMkcert();
      }

      // Final result
      const allSuccess = wordResult.success && mkcertResult.success;
      const mkcertFailed = !mkcertResult.success && !mkcertResult.alreadyExists;
      
      let finalMessage = '';
      
      if (allSuccess) {
        finalMessage = '✅ SETUP HOÀN TẤT!\n\n' +
          '📝 Hosts file: OK\n' +
          '⚙️ Word Registry: OK\n' +
          '🔐 SSL Certificates: OK\n\n' +
          '⚠️ BƯỚC CUỐI (BẮT BUỘC):\n\n' +
          '🔄 RESTART MÁY TÍNH\n\n' +
          'Sau khi restart:\n' +
          '1. Mở 3 terminals\n' +
          '2. Chạy: node server-mongodb.js\n' +
          '3. Chạy: node webdav-simple.js\n' +
          '4. Chạy: npm run dev (trong client/)\n' +
          '5. Mở: http://localhost:5173';
      } else if (wordResult.success && mkcertFailed) {
        finalMessage = '⚠️ SETUP MỘT PHẦN!\n\n' +
          '✅ Hosts file: OK\n' +
          '✅ Word Registry: OK\n' +
          '❌ SSL Certificates: LỖI\n\n' +
          '⚠️ CHẠY THỦ CÔNG (PowerShell Admin):\n\n' +
          'cd word-setup-tool\n' +
          '.\\mkcert.exe -install\n' +
          '.\\mkcert.exe -cert-file ..\\certs\\wordserver.local.crt -key-file ..\\certs\\wordserver.local.key wordserver.local localhost 127.0.0.1 ::1\n\n' +
          '🔄 SAU ĐÓ RESTART MÁY';
      } else {
        finalMessage = '❌ SETUP THẤT BẠI!\n\n' + 
          (wordResult.message || '') + '\n' + 
          (mkcertResult.message || '');
      }

      mainWindow.webContents.send('setup-complete', {
        success: allSuccess,
        alreadyConfigured: false,
        message: finalMessage
      });
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
