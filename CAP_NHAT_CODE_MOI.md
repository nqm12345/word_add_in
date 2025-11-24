# 🔄 HƯỚNG DẪN CẬP NHẬT CODE MỚI

## 🎯 CÁC THAY ĐỔI MỚI NHẤT:

### **✅ Đã fix các lỗi:**

1. **App stuck ở "Updating registry settings"**
   - Fix: Xóa lệnh pause trong script
   
2. **Browser không upload được file (SSL error)**
   - Fix: Hướng dẫn accept SSL certificates
   
3. **Word hiện cảnh báo SSL mỗi lần mở file**
   - Fix: Tự động install certificate vào Trusted Root
   
4. **Word save file vào local thay vì server**
   - Fix: Thêm Trusted Location cho WebDAV (port 3001)

### **✅ Cải tiến:**

- Script PowerShell hoàn chỉnh (6 bước)
- Tất cả fix gói vào Word Setup Tool
- Tài liệu đầy đủ
- Script accept-certificates.bat tự động

---

## 📦 CÁCH CẬP NHẬT:

### **BƯỚC 1: LẤY CODE MỚI**

```bash
# Mở PowerShell hoặc Git Bash
cd D:\datv_word

# Pull code mới từ GitHub
git pull origin main
```

**Nếu có conflict:**
```bash
# Backup changes của bạn
git stash

# Pull code mới
git pull origin main

# Apply lại changes
git stash pop
```

---

### **BƯỚC 2: CÀI ĐẶT LẠI (Nếu cần)**

```bash
# Vào folder word-setup-tool
cd word-setup-tool

# Cài dependencies mới (nếu có)
npm install
```

---

### **BƯỚC 3: CHẠY WORD SETUP TOOL**

#### **Cách 1: Development mode (dành cho dev)**

```bash
# Vào folder
cd word-setup-tool

# Mở PowerShell as Administrator
# Right-click PowerShell → "Run as administrator"

# Chạy app
npm start
```

#### **Cách 2: Build thành .exe (dành cho khách hàng)**

```bash
# Vào folder
cd word-setup-tool

# Build app
npm run build

# Kết quả:
# dist/Word Setup Tool Setup.exe (Installer)
# dist/win-unpacked/Word Setup Tool.exe (Portable)
```

---

### **BƯỚC 4: CHẠY SETUP**

```
1. Mở Word Setup Tool
   - npm start (dev mode)
   - hoặc chạy .exe (production)

2. Click "Auto Setup Word Desktop"

3. App sẽ chạy 6 bước:
   [1/6] Installing SSL Certificate
   [2/6] Disabling Protected View
   [3/6] Enabling Network Locations
   [4/6] Adding Trusted Locations (3000 + 3001)
   [5/6] Killing Word Processes
   [6/6] Verifying

4. Đợi "SETUP COMPLETED!"
```

---

### **BƯỚC 5: ACCEPT SSL CERTIFICATES (1 LẦN DUY NHẤT)**

#### **Cách 1: Dùng script (Đơn giản)**

```batch
# Chạy file này (ở folder gốc):
accept-certificates.bat

# 2 tabs browser sẽ tự động mở
# Trên mỗi tab:
1. Click "Advanced" (Nâng cao)
2. Click "Proceed to wordserver.local (unsafe)"
```

#### **Cách 2: Thủ công**

```
1. Mở browser, vào: https://wordserver.local:3000
   - Thấy cảnh báo SSL
   - Click "Advanced" → "Proceed to wordserver.local (unsafe)"

2. Mở tab mới, vào: https://wordserver.local:3001
   - Click "Advanced" → "Proceed to wordserver.local (unsafe)"

3. Quay lại trang web, refresh (F5)
```

---

### **BƯỚC 6: RESTART COMPUTER** ⚠️

```
QUAN TRỌNG: Phải restart máy!

Lý do:
- Registry changes cần restart để có hiệu lực 100%
- SSL certificate cần restart để Word nhận ra
```

---

### **BƯỚC 7: TEST DỰ ÁN**

```
1. Chạy MongoDB (nếu chưa chạy):
   - MongoDB đang chạy as Windows Service
   - Hoặc: mongod

2. Chạy 3 servers (3 terminals riêng biệt):

   Terminal 1 - API Server:
   cd server
   node server-mongodb.js

   Terminal 2 - WebDAV Server:
   cd server
   node webdav-simple.js

   Terminal 3 - React Client:
   cd client
   npm run dev

3. Mở browser: http://localhost:5173

4. Upload file Word (.docx)

5. Click "Chỉnh sửa" (Edit)

6. Word Desktop mở file

7. Edit nội dung

8. Ctrl+S để save

9. Refresh browser → Thấy thay đổi

✅ THÀNH CÔNG!
```

---

## 🔧 XỬ LÝ LỖI

### **Lỗi: "git pull" thất bại**

```bash
# Check xem có thay đổi local không
git status

# Nếu có thay đổi:
git stash        # Backup
git pull         # Pull code mới
git stash pop    # Apply lại changes
```

### **Lỗi: "npm install" thất bại**

```bash
# Xóa node_modules và cài lại
cd word-setup-tool
Remove-Item -Recurse -Force node_modules
npm install
```

### **Lỗi: Word Setup Tool không chạy**

```
1. Chạy PowerShell as Administrator
2. Kiểm tra file ADD_TRUSTED_LOCATION.ps1 có trong word-setup-tool/
3. Nếu không có → Pull lại code
```

### **Lỗi: Upload file vẫn bị block**

```
1. Check xem đã accept SSL certificates chưa:
   - https://wordserver.local:3000
   - https://wordserver.local:3001

2. Nếu chưa → Accept lại (Bước 5)

3. Refresh browser
```

### **Lỗi: Word vẫn save vào local**

```
1. Check Registry:
   Win+R → regedit
   HKEY_CURRENT_USER\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\
   → Phải có Location98 và Location99

2. Nếu không có → Chạy lại Word Setup Tool

3. Restart computer

4. Test lại
```

---

## ✅ CHECKLIST

```
□ Pull code mới: git pull origin main
□ npm install (trong word-setup-tool)
□ Chạy Word Setup Tool (as Administrator)
□ Accept SSL certificates
□ Restart computer
□ Chạy 3 servers
□ Test upload & edit
□ ✅ DONE!
```

---

## 📞 HỖ TRỢ

**Repository:** https://github.com/nqm12345/word_add_in

**Tài liệu:**
- `TONG_HOP_LOI_VA_FIX.md` - Tổng hợp lỗi & cách fix
- `LUONG_HOAT_DONG.md` - Luồng hoạt động chi tiết
- `HUONG_DAN_ACCEPT_CERT.txt` - Hướng dẫn accept SSL

**Scripts hỗ trợ:**
- `accept-certificates.bat` - Accept SSL tự động
- `word-setup-tool/ADD_TRUSTED_LOCATION.ps1` - Setup Word Desktop

---

## 🎯 TÓM TẮT

```
1. git pull origin main
2. npm install (word-setup-tool)
3. Chạy Word Setup Tool (as Admin)
4. Accept SSL certificates
5. Restart computer
6. Test

→ TẤT CẢ LỖI ĐÃ ĐƯỢC FIX! ✅
```
