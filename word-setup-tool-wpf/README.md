# Word Setup Tool (WPF Version)

🔧 Ứng dụng cấu hình Word Desktop để tích hợp với WebDAV Server.

## ✨ Features

- 🎨 **Modern UI** với Custom Dark Theme
- 🌙 **Dark Theme** mặc định
- 🔒 **Native Windows** integration
- 🚀 **Tự động** cấu hình tất cả
- 📦 **Self-contained** - không cần cài .NET Runtime

## 📋 Chức năng

1. ✅ Cấu hình hosts file (`127.0.0.1 wordserver.local`)
2. ✅ Tắt Protected View trong Word
3. ✅ Thêm Trusted Location cho WebDAV URL
4. ✅ Enable Network Locations
5. ✅ Cài đặt mkcert CA certificate
6. ✅ Tạo SSL certificates

## 🛠️ Build

### Yêu cầu
- .NET 8.0 SDK
- Windows 10/11

### Build commands

```bash
# Restore packages
dotnet restore

# Build Debug
dotnet build

# Build Release (single file)
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true

# Output: bin/Release/net8.0-windows/win-x64/publish/WordSetupTool.exe
```

## 📦 Files

```
word-setup-tool-wpf/
├── WordSetupTool.csproj    # Project file
├── App.xaml                # Application definition (Material Design theme)
├── App.xaml.cs             # Application startup
├── MainWindow.xaml         # Main UI (XAML)
├── MainWindow.xaml.cs      # UI code-behind
├── SetupService.cs         # Setup logic (hosts, registry, mkcert)
├── app.manifest            # Admin privileges manifest
├── mkcert.exe              # Certificate generator tool
└── README.md               # This file
```

## 🎨 Tech Stack

- **Framework**: .NET 8.0 WPF
- **UI**: Custom XAML (Pure WPF, no external UI libraries)
- **Language**: C# 12
- **Target**: Windows 10/11 x64

## 📊 Thông số

| Feature | Value |
|---------|-------|
| Kích thước | ~160MB (self-contained) |
| RAM | ~30MB |
| Startup | <1s |
| Requires | Windows 10/11 64-bit |
| Admin | Required (auto-prompt) |

## 🚀 Usage

1. Build project
2. Copy `WordSetupTool.exe` và `mkcert.exe` vào cùng folder
3. Run as Administrator
4. Click "BẮT ĐẦU SETUP"
5. Restart computer
6. Run servers và test!
