# Word Setup Tool

Modern desktop app tự động setup Microsoft Word Desktop cho Word Editor.

## 🎯 Mục đích

App này CHỈ có 1 mục đích:
- ✅ Tự động setup Word Desktop cho khách hàng
- ✅ Không cần khách làm gì thủ công
- ✅ Chạy → Setup → Done!

## 🚀 Sử dụng

### Development:
```bash
cd word-setup-tool
npm install
npm start
```

### Build:
```bash
npm run build
```

Output: `dist/Word Setup Tool Setup.exe`

### Cho khách hàng:
```
1. Double-click "Word Setup Tool Setup.exe"
2. App tự động:
   - Check Word Desktop đã setup chưa
   - Nếu chưa → Tự động setup
   - Hiện progress với visual feedback
3. Click "Close Application"
4. Done!
```

## ✅ App tự động làm gì?

1. ✅ Check Registry (Trusted Location đã tồn tại chưa)
2. ✅ Close tất cả Word processes
3. ✅ Chạy PowerShell script (ADD_TRUSTED_LOCATION.ps1)
4. ✅ Refresh Explorer
5. ✅ Hiện thông báo "Done" với visual feedback

## 📋 Yêu cầu

- Windows 10/11
- Microsoft Word Desktop (2016+)
- PowerShell

## 🎨 UI Features

### Modern Design:
- ✅ Sidebar navigation (Discord-style)
- ✅ Gradient header
- ✅ Card-based layout
- ✅ Dark theme (Catppuccin Mocha colors)
- ✅ Real-time progress tracking
- ✅ Status badges with colors
- ✅ Smooth animations
- ✅ Professional, tech look

### UI Components:
- Sidebar với navigation
- Gradient header banner
- Status badge (live updates)
- Progress cards với checkmarks
- Message boxes (success/error)
- Modern button styles

## 🔧 Tech Stack

- Electron 28
- Vanilla JavaScript
- Pure CSS (Catppuccin color scheme)
- Modern UI/UX patterns
