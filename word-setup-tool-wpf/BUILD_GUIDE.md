# 🔧 Hướng dẫn Build Word Setup Tool (WPF)

## 📦 Bước 1: Cài .NET 8.0 SDK

### Tải về:
```
https://dotnet.microsoft.com/en-us/download/dotnet/8.0
```

### Hoặc dùng winget:
```powershell
winget install Microsoft.DotNet.SDK.8
```

### Verify cài đặt:
```powershell
dotnet --version
# Output: 8.0.xxx
```

---

## 🛠️ Bước 2: Build Project

### Mở PowerShell/CMD trong folder `word-setup-tool-wpf`:

```powershell
cd d:\datv_word\word-setup-tool-wpf
```

### Restore packages:
```powershell
dotnet restore
```

### Build Debug (để test):
```powershell
dotnet build
```

### Build Release (single file cho distribution):
```powershell
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

---

## 📂 Output

### Debug build:
```
bin/Debug/net8.0-windows/win-x64/WordSetupTool.exe
```

### Release build (single file):
```
bin/Release/net8.0-windows/win-x64/publish/WordSetupTool.exe
```

---

## 📋 Files cần cho distribution:

```
📁 Distribution folder/
├── WordSetupTool.exe     # Main app (~20MB)
└── mkcert.exe            # Certificate tool (~5MB)
```

**Tổng: ~25MB** (so với Electron ~150MB)

---

## 🚀 Run

1. Copy `WordSetupTool.exe` và `mkcert.exe` vào cùng folder
2. Right-click → Run as Administrator
3. Click "BẮT ĐẦU SETUP"
4. Restart computer khi hoàn tất

---

## ❓ Troubleshooting

### Lỗi "dotnet not found":
```powershell
# Restart PowerShell sau khi cài .NET SDK
# Hoặc add vào PATH:
$env:Path += ";C:\Program Files\dotnet"
```

### Lỗi build:
```powershell
# Clean và build lại
dotnet clean
dotnet restore
dotnet build
```

### Lỗi MaterialDesign:
```powershell
# Restore NuGet packages
dotnet restore --force
```
