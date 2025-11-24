# 🔨 HƯỚNG DẪN BUILD WORD SETUP TOOL

## 📋 YÊU CẦU:

- Node.js (đã cài)
- npm (đã cài)
- Git (đã cài)

---

## 🚀 CÁC BƯỚC BUILD:

### **1. Lấy code mới nhất:**

```bash
cd D:\datv_word
git pull origin main
```

### **2. Vào thư mục word-setup-tool:**

```bash
cd word-setup-tool
```

### **3. Cài dependencies (lần đầu tiên):**

```bash
npm install
```

**Đợi cài xong:**
- `electron` (~200 MB)
- `electron-builder` (~50 MB)
- Dependencies khác

### **4. Build app:**

```bash
npm run build
```

**Quá trình build:**
```
✓ Packaging application
✓ Building NSIS installer
✓ Creating executable

Thời gian: ~30-60 giây
```

### **5. Tìm file .exe:**

```
Vị trí: word-setup-tool\dist\

File: Word Setup Tool Setup 1.0.0.exe (~35-40 MB)
```

---

## ✅ CHẠY APP:

### **Cách 1: Development Mode (Test nhanh)**

```bash
npm start
```

- Không tạo file .exe
- Chạy trực tiếp từ code
- Dùng để test thay đổi

### **Cách 2: Build & Install**

```bash
npm run build
cd dist
.\Word Setup Tool Setup 1.0.0.exe
```

- Tạo file .exe
- Cài đặt app vào máy
- App sẽ ở: `%LOCALAPPDATA%\Programs\word-setup-tool\`

---

## 📦 OUTPUT FILES:

```
dist/
├── Word Setup Tool Setup 1.0.0.exe        ← FILE CHÍNH (35-40 MB)
│   └─ NSIS Installer
│       └─ Cài app vào: %LOCALAPPDATA%\Programs\
│
├── win-unpacked/                          ← Portable version
│   ├── Word Setup Tool.exe                (chạy trực tiếp, không cài)
│   └── resources/
│       ├── app.asar                       (app code)
│       ├── mkcert.exe                     (bundled)
│       ├── ADD_TRUSTED_LOCATION.ps1       (bundled)
│       └── certs/                         (bundled)
│
└── builder-*.yaml                         ← Build config (bỏ qua)
```

---

## 🎯 PHÂN PHỐI CHO USER:

### **Option 1: Gửi file installer**

```
Gửi: Word Setup Tool Setup 1.0.0.exe (35-40 MB)

User:
1. Double-click file .exe
2. App tự động cài vào máy
3. Shortcut xuất hiện trên Desktop
4. Click shortcut để chạy
```

### **Option 2: Gửi portable version**

```
Nén thư mục: win-unpacked/ → ZIP

User:
1. Giải nén ZIP
2. Chạy: Word Setup Tool.exe
3. Không cần cài đặt
```

### **Option 3: GitHub Releases (Khuyến nghị)**

```
1. Build app
2. Upload file .exe lên GitHub Releases
3. User download từ Releases page
4. Version control tốt hơn
```

---

## ⚠️ LƯU Ý:

### **Windows Defender/Antivirus:**

```
⚠️ Lần đầu chạy app có thể bị Windows Defender cảnh báo:
"Windows protected your PC"

Cách fix:
1. Click "More info"
2. Click "Run anyway"

Lý do: App chưa có digital signature
```

### **Chạy as Administrator:**

```
✅ QUAN TRỌNG: Phải chạy app as Administrator!

Lý do:
- Cần quyền admin để sửa Registry
- Cần quyền admin để sửa hosts file
- Cần quyền admin để install SSL certificate
```

---

## 🔧 REBUILD (Khi có thay đổi code):

```bash
# 1. Xóa build cũ
Remove-Item dist -Recurse -Force

# 2. Build lại
npm run build

# 3. Test
cd dist
.\Word Setup Tool Setup 1.0.0.exe
```

---

## 📊 KÍCH THƯỚC FILES:

```
Source code:
- word-setup-tool/ folder: ~150 MB (với node_modules)
- Chỉ code: ~6 MB

Build output:
- Word Setup Tool Setup 1.0.0.exe: ~35-40 MB
- win-unpacked/ folder: ~250 MB

Bundle includes:
- Electron runtime: ~120 MB
- mkcert.exe: 5.3 MB
- App code: ~1 MB
- Dependencies: ~10 MB
```

---

## ✅ CHECKLIST:

```
□ git pull origin main
□ cd word-setup-tool
□ npm install (lần đầu)
□ npm run build
□ Kiểm tra: dist/Word Setup Tool Setup 1.0.0.exe
□ Test chạy file .exe
□ Phân phối cho user

✅ DONE!
```

---

## 💬 HỖ TRỢ:

Nếu có lỗi khi build:
1. Xóa `node_modules/` và `dist/`
2. Chạy lại `npm install`
3. Chạy lại `npm run build`

Nếu vẫn lỗi, kiểm tra:
- Node.js version (cần >= 16)
- npm version (cần >= 8)
- Disk space (cần ~2 GB free)
