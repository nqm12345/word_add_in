using System.Diagnostics;
using System.IO;
using System.Text;
using Microsoft.Win32;

namespace WordSetupTool
{
    public class SetupResult
    {
        public bool Success { get; set; }
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
    }

    public class SetupService
    {
        public event Action<int, string>? OnProgress;
        public event Action<int, bool>? OnStepComplete;

        private const string DOMAIN = "wordserver.local";
        private const string HOSTS_ENTRY = "127.0.0.1 wordserver.local";
        private const string WEBDAV_URL = "https://wordserver.local:3001";
        
        private readonly string _appDir;
        private readonly string _certsDir;
        private readonly string _mkcertPath;

        public SetupService()
        {
            _appDir = AppDomain.CurrentDomain.BaseDirectory;
            _mkcertPath = Path.Combine(_appDir, "mkcert.exe");
            
            // Find project root (folder containing "server" and "client")
            _certsDir = FindCertsDirectory();
        }
        
        private string FindCertsDirectory()
        {
            // Try to find project root by looking for "server" folder
            string currentDir = _appDir;
            
            // Go up max 5 levels to find project root
            for (int i = 0; i < 5; i++)
            {
                string? parentDir = Path.GetDirectoryName(currentDir);
                if (parentDir == null) break;
                
                currentDir = parentDir;
                
                // Check if this is project root (has server folder)
                string serverPath = Path.Combine(currentDir, "server");
                if (Directory.Exists(serverPath))
                {
                    return Path.Combine(currentDir, "certs");
                }
            }
            
            // Fallback: create certs folder next to app
            return Path.Combine(_appDir, "certs");
        }

        public async Task<SetupResult> RunSetupAsync()
        {
            var result = new SetupResult { Success = true };
            var messages = new List<string>();

            try
            {
                // Step 1: Check current config
                OnProgress?.Invoke(5, "Đang kiểm tra cấu hình...");
                await Task.Delay(500);
                
                bool hostsOk = CheckHostsFile();
                bool registryOk = CheckRegistry();
                bool certsOk = CheckCertificates();
                
                OnStepComplete?.Invoke(1, true);
                OnProgress?.Invoke(10, "Kiểm tra hoàn tất");

                if (hostsOk && registryOk && certsOk)
                {
                    OnProgress?.Invoke(100, "Đã cấu hình sẵn!");
                    for (int i = 2; i <= 7; i++) OnStepComplete?.Invoke(i, true);
                    
                    return new SetupResult
                    {
                        Success = true,
                        Title = "Đã cấu hình!",
                        Message = "✅ Hosts file: OK\n✅ Registry: OK\n✅ SSL Certificates: OK\n\nKhông cần setup lại.\nBạn có thể chạy servers ngay."
                    };
                }

                // Step 2: Setup hosts file
                if (!hostsOk)
                {
                    OnProgress?.Invoke(20, "Đang cấu hình hosts file...");
                    await Task.Delay(300);
                    
                    bool hostsResult = SetupHostsFile();
                    OnStepComplete?.Invoke(2, hostsResult);
                    
                    if (hostsResult) messages.Add("✅ Hosts file: OK");
                    else messages.Add("⚠️ Hosts file: Cần cấu hình thủ công");
                }
                else
                {
                    OnStepComplete?.Invoke(2, true);
                    messages.Add("✅ Hosts file: OK");
                }

                // Step 3: Disable Protected View
                OnProgress?.Invoke(35, "Đang tắt Protected View...");
                await Task.Delay(300);
                
                bool protectedViewResult = DisableProtectedView();
                OnStepComplete?.Invoke(3, protectedViewResult);
                
                if (protectedViewResult) messages.Add("✅ Protected View: Disabled");
                else messages.Add("⚠️ Protected View: Cần tắt thủ công");

                // Step 4: Add Trusted Location
                OnProgress?.Invoke(50, "Đang thêm Trusted Location...");
                await Task.Delay(300);
                
                bool trustedResult = AddTrustedLocation();
                OnStepComplete?.Invoke(4, trustedResult);
                
                if (trustedResult) messages.Add("✅ Trusted Location: OK");
                else messages.Add("⚠️ Trusted Location: Cần thêm thủ công");

                // Step 5: Enable Network Locations
                OnProgress?.Invoke(60, "Đang enable Network Locations...");
                await Task.Delay(300);
                
                bool networkResult = EnableNetworkLocations();
                OnStepComplete?.Invoke(5, networkResult);
                
                if (networkResult) messages.Add("✅ Network Locations: Enabled");
                else messages.Add("⚠️ Network Locations: Cần enable thủ công");

                // Step 6: Install mkcert CA
                if (!certsOk)
                {
                    OnProgress?.Invoke(75, "Đang cài đặt mkcert CA...");
                    
                    bool mkcertResult = await InstallMkcertCAAsync();
                    OnStepComplete?.Invoke(6, mkcertResult);
                    
                    if (mkcertResult) messages.Add("✅ mkcert CA: Installed");
                    else
                    {
                        messages.Add("⚠️ mkcert CA: Cần cài thủ công");
                        result.Success = false;
                    }

                    // Step 7: Generate certificates
                    if (mkcertResult)
                    {
                        OnProgress?.Invoke(90, "Đang tạo SSL certificates...");
                        
                        bool certResult = await GenerateCertificatesAsync();
                        OnStepComplete?.Invoke(7, certResult);
                        
                        if (certResult) messages.Add("✅ SSL Certificates: Created");
                        else
                        {
                            messages.Add("⚠️ SSL Certificates: Cần tạo thủ công");
                            result.Success = false;
                        }
                    }
                    else
                    {
                        OnStepComplete?.Invoke(7, false);
                        messages.Add("⚠️ SSL Certificates: Cần tạo thủ công");
                        result.Success = false;
                    }
                }
                else
                {
                    OnStepComplete?.Invoke(6, true);
                    OnStepComplete?.Invoke(7, true);
                    messages.Add("✅ mkcert CA: OK");
                    messages.Add("✅ SSL Certificates: OK");
                }

                OnProgress?.Invoke(100, "Setup hoàn tất!");

                // Build result message
                result.Title = result.Success ? "Setup hoàn tất!" : "Setup một phần!";
                
                var sb = new StringBuilder();
                sb.AppendLine(string.Join("\n", messages));
                sb.AppendLine();
                
                if (result.Success)
                {
                    sb.AppendLine("⚠️ QUAN TRỌNG: RESTART MÁY TÍNH");
                    sb.AppendLine();
                    sb.AppendLine("Sau khi restart:");
                    sb.AppendLine("1. cd server && node server-mongodb.js");
                    sb.AppendLine("2. cd server && node webdav-simple.js");
                    sb.AppendLine("3. cd client && npm run dev");
                    sb.AppendLine("4. Mở http://localhost:5173");
                }
                else
                {
                    sb.AppendLine("⚠️ CHẠY THỦ CÔNG (PowerShell Admin):");
                    sb.AppendLine("cd word-setup-tool-wpf");
                    sb.AppendLine(".\\mkcert.exe -install");
                    sb.AppendLine(".\\mkcert.exe -cert-file ..\\certs\\wordserver.local.crt -key-file ..\\certs\\wordserver.local.key wordserver.local localhost 127.0.0.1 ::1");
                }
                
                result.Message = sb.ToString();
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Title = "Lỗi!";
                result.Message = $"Đã xảy ra lỗi: {ex.Message}";
            }

            return result;
        }

        #region Check Methods

        private bool CheckHostsFile()
        {
            try
            {
                string hostsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "drivers", "etc", "hosts");
                string content = File.ReadAllText(hostsPath);
                return content.Contains(DOMAIN);
            }
            catch
            {
                return false;
            }
        }

        private bool CheckRegistry()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\Location99");
                return key != null;
            }
            catch
            {
                return false;
            }
        }

        private bool CheckCertificates()
        {
            string crtPath = Path.GetFullPath(Path.Combine(_certsDir, "wordserver.local.crt"));
            string keyPath = Path.GetFullPath(Path.Combine(_certsDir, "wordserver.local.key"));
            return File.Exists(crtPath) && File.Exists(keyPath);
        }

        #endregion

        #region Setup Methods

        private bool SetupHostsFile()
        {
            try
            {
                string hostsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "drivers", "etc", "hosts");
                string content = File.ReadAllText(hostsPath);
                
                if (!content.Contains(DOMAIN))
                {
                    content = content.TrimEnd() + Environment.NewLine + HOSTS_ENTRY + Environment.NewLine;
                    File.WriteAllText(hostsPath, content);
                }
                
                return true;
            }
            catch
            {
                return false;
            }
        }

        private bool DisableProtectedView()
        {
            try
            {
                string keyPath = @"Software\Microsoft\Office\16.0\Word\Security\ProtectedView";
                
                using var key = Registry.CurrentUser.CreateSubKey(keyPath);
                if (key != null)
                {
                    key.SetValue("DisableInternetFilesInPV", 1, RegistryValueKind.DWord);
                    key.SetValue("DisableAttachementsInPV", 1, RegistryValueKind.DWord);
                    key.SetValue("DisableUnsafeLocationsInPV", 1, RegistryValueKind.DWord);
                    return true;
                }
                
                return false;
            }
            catch
            {
                return false;
            }
        }

        private bool AddTrustedLocation()
        {
            try
            {
                string keyPath = @"Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\Location99";
                
                using var key = Registry.CurrentUser.CreateSubKey(keyPath);
                if (key != null)
                {
                    key.SetValue("Path", WEBDAV_URL, RegistryValueKind.String);
                    key.SetValue("Description", "Word Editor WebDAV Server", RegistryValueKind.String);
                    key.SetValue("AllowSubfolders", 1, RegistryValueKind.DWord);
                    return true;
                }
                
                return false;
            }
            catch
            {
                return false;
            }
        }

        private bool EnableNetworkLocations()
        {
            try
            {
                string keyPath = @"Software\Microsoft\Office\16.0\Word\Security";
                
                using var key = Registry.CurrentUser.CreateSubKey(keyPath);
                if (key != null)
                {
                    key.SetValue("AllowNetworkLocations", 1, RegistryValueKind.DWord);
                    return true;
                }
                
                return false;
            }
            catch
            {
                return false;
            }
        }

        private async Task<bool> InstallMkcertCAAsync()
        {
            if (!File.Exists(_mkcertPath))
                return false;

            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = _mkcertPath,
                    Arguments = "-install",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };

                using var process = Process.Start(psi);
                if (process == null) return false;

                var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                
                try
                {
                    await process.WaitForExitAsync(cts.Token);
                    return process.ExitCode == 0;
                }
                catch (OperationCanceledException)
                {
                    process.Kill();
                    return false;
                }
            }
            catch
            {
                return false;
            }
        }

        private async Task<bool> GenerateCertificatesAsync()
        {
            if (!File.Exists(_mkcertPath))
                return false;

            try
            {
                // Ensure certs directory exists
                string certsFullPath = Path.GetFullPath(_certsDir);
                Directory.CreateDirectory(certsFullPath);

                string crtPath = Path.Combine(certsFullPath, "wordserver.local.crt");
                string keyPath = Path.Combine(certsFullPath, "wordserver.local.key");

                var psi = new ProcessStartInfo
                {
                    FileName = _mkcertPath,
                    Arguments = $"-cert-file \"{crtPath}\" -key-file \"{keyPath}\" wordserver.local localhost 127.0.0.1 ::1",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };

                using var process = Process.Start(psi);
                if (process == null) return false;

                var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                
                try
                {
                    await process.WaitForExitAsync(cts.Token);
                    return File.Exists(crtPath) && File.Exists(keyPath);
                }
                catch (OperationCanceledException)
                {
                    process.Kill();
                    return false;
                }
            }
            catch
            {
                return false;
            }
        }

        #endregion
    }
}
