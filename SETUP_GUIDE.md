# 🚀 HƯỚNG DẪN SETUP HOÀN CHỈNH

## 📋 YÊU CẦU HỆ THỐNG

### Phần mềm cần thiết:
- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **MongoDB 4.4+** - [Download](https://www.mongodb.com/try/download/community)
- ✅ **mkcert** - Tạo SSL certificates
- ✅ **Microsoft Word Desktop** - Word 2016 trở lên
- ✅ **Windows 10/11** - Hệ điều hành

---

## 🔧 BƯỚC 1: CÀI ĐẶT NODE.JS

### 1.1. Download & Install Node.js
```
https://nodejs.org/
→ Download bản LTS (Long Term Support)
→ Cài đặt với tất cả options mặc định
```

### 1.2. Kiểm tra cài đặt
```bash
node --version
# Phải hiện: v18.x.x hoặc cao hơn

npm --version
# Phải hiện: 9.x.x hoặc cao hơn
```

---

## 💾 BƯỚC 2: CÀI ĐẶT MONGODB

### 2.1. Download MongoDB Community
```
https://www.mongodb.com/try/download/community
→ Chọn Windows
→ Download MSI installer
→ Cài đặt
```

### 2.2. Chạy MongoDB
```bash
# Option 1: Windows Service (tự động chạy khi khởi động)
# MongoDB installer tự động cài như service

# Option 2: Chạy thủ công
mongod --dbpath "C:\data\db"
```

### 2.3. Kiểm tra MongoDB
```bash
# Mở terminal mới
mongosh

# Trong mongosh:
show dbs
exit
```

**✅ MongoDB đã sẵn sàng!**

---

## 🔐 BƯỚC 3: CÀI ĐẶT MKCERT (SSL CERTIFICATES)

### 3.1. Cài đặt Chocolatey (nếu chưa có)
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 3.2. Cài đặt mkcert
```powershell
# Run PowerShell as Administrator
choco install mkcert
```

### 3.3. Install Root CA
```powershell
mkcert -install
```

**✅ mkcert đã cài xong!**

---

## 📦 BƯỚC 4: CLONE & SETUP PROJECT

### 4.1. Clone Repository
```bash
git clone https://github.com/nqm12345/word_add_in.git
cd word_add_in
```

### 4.2. Install Dependencies
```bash
# Cài tất cả dependencies (server + client)
npm run install-all
```

**Hoặc cài từng phần:**
```bash
# Server dependencies
npm install

# Client dependencies
cd client
npm install
cd ..
```

---

## 🔒 BƯỚC 5: TẠO SSL CERTIFICATES

### 5.1. Tạo folder certs
```bash
mkdir certs
cd certs
```

### 5.2. Generate certificates
```bash
mkcert wordserver.local
```

**Output sẽ tạo 2 files:**
- `wordserver.local.pem` (certificate)
- `wordserver.local-key.pem` (private key)

### 5.3. Đổi tên files
```bash
# Windows PowerShell
Rename-Item "wordserver.local.pem" "wordserver.local.crt"
Rename-Item "wordserver.local-key.pem" "wordserver.local.key"
```

### 5.4. Kiểm tra
```
certs/
├── wordserver.local.crt  ✅
└── wordserver.local.key  ✅
```

---

## 🌐 BƯỚC 6: SETUP HOSTS FILE

### 6.1. Mở Notepad as Administrator
```
1. Search "Notepad" trong Start Menu
2. Right-click → Run as administrator
```

### 6.2. Mở hosts file
```
File → Open
C:\Windows\System32\drivers\etc\hosts
Chọn "All Files (*.*)" để thấy file hosts
```

### 6.3. Thêm dòng này
```
127.0.0.1 wordserver.local
```

### 6.4. Save & Close

### 6.5. Kiểm tra
```bash
ping wordserver.local
# Phải trả về: Reply from 127.0.0.1
```

**✅ Hosts file đã setup!**

---

## 🎯 BƯỚC 7: SETUP WORD DESKTOP (QUAN TRỌNG!)

### 7.1. Chạy PowerShell Script (Khuyên dùng)

**Run PowerShell as Administrator:**
```powershell
cd path\to\word_add_in
powershell -ExecutionPolicy Bypass -File "ADD_TRUSTED_LOCATION.ps1"
```

**Script sẽ:**
- ✅ Tắt Protected View
- ✅ Enable Network Locations
- ✅ Thêm Trusted Location
- ✅ Close tất cả Word processes

---

### 7.2. Setup Thủ Công (nếu script lỗi)

#### **Bước 7.2.1: Tắt Protected View**

1. Mở **Word**
2. **File** → **Options** → **Trust Center** → **Trust Center Settings**
3. Click **Protected View**
4. **Bỏ tick** tất cả 3 options:
   - ☐ Enable Protected View for files originating from the Internet
   - ☐ Enable Protected View for files located in potentially unsafe locations
   - ☐ Enable Protected View for Outlook attachments
5. Click **OK**

#### **Bước 7.2.2: Enable Network Locations**

1. Trong **Trust Center Settings**
2. Click **Trusted Locations**
3. **Tick:** ☑ Allow Trusted Locations on my network
4. Click **OK**

#### **Bước 7.2.3: Add Trusted Location**

1. Trong **Trusted Locations**
2. Click **Add new location...**
3. **Path:** `https://wordserver.local:3000/`
4. **Tick:** ☑ Subfolders of this location are also trusted
5. Click **OK**

#### **Bước 7.2.4: Restart Word**

Close tất cả Word windows và mở lại

**✅ Word Desktop đã setup!**

---

## 🚀 BƯỚC 8: CHẠY DỰ ÁN

### 8.1. Start MongoDB (nếu chưa chạy)
```bash
# Nếu MongoDB chưa chạy như service:
mongod --dbpath "C:\data\db"
```

### 8.2. Start Servers
```bash
# Trong folder dự án
npm start
```

**Sẽ chạy 3 servers:**
```
[0] API Server:    https://wordserver.local:3000
[1] WebDAV Server: https://wordserver.local:3001
[2] React App:     http://localhost:5173
```

### 8.3. Mở React App
```
Browser → http://localhost:5173
```

**✅ Dự án đã chạy!**

---

## 🧪 BƯỚC 9: TEST CHỨC NĂNG

### 9.1. Test Upload
1. Click "Chọn tệp"
2. Chọn file `.docx`
3. Click "Upload"
4. ✅ File hiện trong danh sách

### 9.2. Test Download
1. Click "📥 Tải xuống" trên file
2. ✅ File download về máy

### 9.3. Test Edit (QUAN TRỌNG!)
1. Click "✏️ Chỉnh sửa" trên file
2. ✅ Word Desktop mở file
3. ✅ KHÔNG hiện "Protected View" hoặc "Read-only"
4. Edit content trong Word
5. **Ctrl+S** để save
6. ✅ KHÔNG hiện "Save As" dialog
7. ✅ File tự động lưu về server
8. Refresh browser
9. ✅ File đã update

### 9.4. Test Delete
1. Click "🗑️ Xóa" trên file
2. Confirm
3. ✅ File bị xóa

**✅ Tất cả chức năng hoạt động!**

---

## 🔍 TROUBLESHOOTING

### ❌ Lỗi: "SSL certificates not found"

**Nguyên nhân:** Chưa tạo certificates

**Fix:**
```bash
cd certs
mkcert wordserver.local
Rename-Item "wordserver.local.pem" "wordserver.local.crt"
Rename-Item "wordserver.local-key.pem" "wordserver.local.key"
```

---

### ❌ Lỗi: "Cannot connect to MongoDB"

**Nguyên nhân:** MongoDB chưa chạy

**Fix:**
```bash
# Option 1: Start service
net start MongoDB

# Option 2: Start manually
mongod --dbpath "C:\data\db"
```

---

### ❌ Lỗi: Word mở file ở chế độ "Read-only"

**Nguyên nhân:** Chưa setup Trusted Location

**Fix:**
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File "ADD_TRUSTED_LOCATION.ps1"
```

**Hoặc restart máy!**

---

### ❌ Lỗi: Word hiện "Save As" dialog khi Ctrl+S

**Nguyên nhân:** Trusted Location chưa apply

**Fix:**
1. Chạy script `ADD_TRUSTED_LOCATION.ps1`
2. **RESTART COMPUTER**
3. Test lại

---

### ❌ Lỗi: "Cannot resolve wordserver.local"

**Nguyên nhân:** Hosts file chưa setup

**Fix:**
```
1. Open: C:\Windows\System32\drivers\etc\hosts (as Admin)
2. Add: 127.0.0.1 wordserver.local
3. Save
4. Test: ping wordserver.local
```

---

### ❌ Lỗi: Port 3000 hoặc 3001 đã được sử dụng

**Nguyên nhân:** Có process khác đang dùng port

**Fix:**
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Hoặc thay đổi port trong server/config.js
```

---

## 📝 CHECKLIST SETUP

### ✅ Software:
- [ ] Node.js 18+ installed
- [ ] MongoDB installed & running
- [ ] mkcert installed
- [ ] Chocolatey installed (for mkcert)

### ✅ Project:
- [ ] Repository cloned
- [ ] Dependencies installed (`npm run install-all`)
- [ ] SSL certificates generated
- [ ] Hosts file updated

### ✅ Word Desktop:
- [ ] Protected View disabled
- [ ] Network Locations enabled
- [ ] Trusted Location added
- [ ] Word restarted

### ✅ Testing:
- [ ] MongoDB connected
- [ ] All 3 servers running
- [ ] React app accessible
- [ ] Upload works
- [ ] Download works
- [ ] Edit in Word works (NO "Save As")
- [ ] Delete works

---

## 🎯 QUICK START (Sau khi đã setup)

### Mỗi lần chạy dự án:

```bash
# 1. Start MongoDB (nếu chưa chạy)
mongod

# 2. Start all servers
npm start

# 3. Mở browser
http://localhost:5173
```

**Xong! Chỉ 3 bước!**

---

## 📚 TÀI LIỆU THAM KHẢO

- **README.md** - Tổng quan dự án
- **OPTIMIZATION_SUMMARY.md** - Chi tiết tối ưu code
- **FINAL_CLEANUP.md** - Chi tiết cleanup
- **ADD_TRUSTED_LOCATION.ps1** - Script setup Word

---

## 🆘 HỖ TRỢ

Nếu gặp vấn đề:

1. **Check MongoDB:** `mongosh` để xem đã connect chưa
2. **Check Certificates:** `dir certs` phải có .crt và .key
3. **Check Hosts:** `ping wordserver.local` phải reply
4. **Check Ports:** Servers phải chạy đúng ports
5. **Check Word:** Trusted Location phải setup đúng

**Nếu vẫn lỗi → Restart máy!** (Thường fix được 90% lỗi)

---

**CHÚC BẠN SETUP THÀNH CÔNG!** 🎉

**Thời gian setup:** ~30-45 phút (lần đầu)

**Sau khi setup xong:** Chỉ cần `npm start` là chạy! ⚡
