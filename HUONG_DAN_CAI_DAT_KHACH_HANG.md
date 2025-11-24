# HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG - KHÁCH HÀNG

## 📋 MỤC LỤC
1. [Cài đặt phần mềm](#1-cài-đặt-phần-mềm)
2. [Lấy code và cài dependencies](#2-lấy-code-và-cài-dependencies)
3. [Setup hệ thống](#3-setup-hệ-thống)
4. [Chạy dự án](#4-chạy-dự-án)
5. [Test](#5-test)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. CÀI ĐẶT PHẦN MỀM

### 1.1. MongoDB (Database)

**Bước 1:** Download MongoDB
```
Link: https://www.mongodb.com/try/download/community
Version: MongoDB Community Server (Latest)
```

**Bước 2:** Cài đặt
```
1. Double-click file .msi đã download
2. Click "Next"
3. Chọn "Complete"
4. ✅ Tick vào "Install MongoDB as a Service"
5. ✅ Tick vào "Run service as Network Service user"
6. Click "Next" → "Install"
7. Đợi cài đặt xong
```

**Bước 3:** Kiểm tra MongoDB đã chạy
```powershell
# PowerShell
sc query MongoDB
```

Phải thấy: `STATE: RUNNING`

---

### 1.2. Node.js (JavaScript Runtime)

**Bước 1:** Download Node.js
```
Link: https://nodejs.org/
Version: LTS (Long Term Support) - Recommended
```

**Bước 2:** Cài đặt
```
1. Double-click file .msi đã download
2. Click "Next" → "Next" → "Install"
3. Đợi cài đặt xong
```

**Bước 3:** Kiểm tra Node.js đã cài
```cmd
# Command Prompt
node --version
npm --version
```

Phải thấy: `v20.x.x` và `10.x.x`

---

### 1.3. Git (Version Control)

**Bước 1:** Download Git
```
Link: https://git-scm.com/download/win
Version: Latest
```

**Bước 2:** Cài đặt
```
1. Double-click file .exe đã download
2. Click "Next" nhiều lần (giữ mặc định)
3. Click "Install"
```

**Bước 3:** Kiểm tra Git đã cài
```cmd
git --version
```

Phải thấy: `git version 2.x.x`

---

### 1.4. Microsoft Word

```
✅ Phải có Microsoft Word Desktop đã cài sẵn
✅ Office 365 hoặc Office 2016 trở lên
✅ Không cần setup gì thêm
```

---

## 2. LẤY CODE VÀ CÀI DEPENDENCIES

### 2.1. Clone code từ GitHub

```bash
# Mở Command Prompt hoặc PowerShell
cd C:\Users\Admin\Desktop\
git clone https://github.com/nqm12345/word_add_in.git
cd word_add_in
```

---

### 2.2. Cài dependencies

#### **Server:**
```bash
cd server
npm install
cd ..
```

Đợi ~1-2 phút, phải thấy: `added xxx packages`

#### **Client:**
```bash
cd client
npm install
cd ..
```

Đợi ~1-2 phút, phải thấy: `added xxx packages`

#### **Word Setup Tool:**
```bash
cd word-setup-tool
npm install
cd ..
```

Đợi ~30 giây, phải thấy: `added xxx packages`

---

## 3. SETUP HỆ THỐNG

### 3.1. Chạy Word Setup Tool

**Bước 1:** Mở Word Setup Tool
```
1. Mở File Explorer
2. Vào: C:\Users\Admin\Desktop\word_add_in\word-setup-tool\dist\
3. Tìm file: "Word Setup Tool Setup 1.0.0.exe"
4. Right-click → "Run as administrator"
5. Click "Yes" ở UAC prompt
```

**Bước 2:** Chạy setup
```
1. Click button "Auto Setup Word Desktop"
2. Đợi 30-60 giây
3. Thấy: "✅ SETUP HOÀN TẤT!"
4. Đọc hướng dẫn bước tiếp theo
5. Đóng app
```

**App đã làm gì?**
```
✅ Setup hosts file (127.0.0.1 → wordserver.local)
✅ Disable Protected View
✅ Enable Network Locations
✅ Add Trusted Locations
✅ Disable SSL warnings
✅ Close Word processes
```

---

### 3.2. Setup SSL Certificates (THỦ CÔNG)

**⚠️ QUAN TRỌNG: PHẢI LÀM BƯỚC NÀY!**

**Bước 1:** Mở PowerShell as Administrator
```
1. Right-click Start button
2. Chọn "Windows PowerShell (Admin)"
3. Click "Yes"
```

**Bước 2:** Chạy các lệnh sau (Copy & Paste toàn bộ)

```powershell
cd C:\Users\Admin\Desktop\word_add_in\word-setup-tool
.\mkcert.exe -install
.\mkcert.exe -cert-file ..\certs\wordserver.local.crt -key-file ..\certs\wordserver.local.key wordserver.local localhost 127.0.0.1 ::1
reg add "HKCU\Software\Microsoft\Office\16.0\Word\Security" /v AllowNetworkLocations /t REG_DWORD /d 1 /f
```

**Bước 3:** Kiểm tra certificates đã tạo
```powershell
cd ..\certs
dir
```

**Phải thấy 2 files:**
```
wordserver.local.crt
wordserver.local.key
```

**Nếu thấy 2 files → ✅ THÀNH CÔNG!**

---

### 3.3. Restart máy

**⚠️ BẮT BUỘC PHẢI RESTART!**

```powershell
shutdown /r /t 0
```

Hoặc: `Start → Power → Restart`

---

## 4. CHẠY DỰ ÁN

**SAU KHI RESTART MÁY, mở 3 terminals:**

### Terminal 1: API Server

```bash
cd C:\Users\Admin\Desktop\word_add_in\server
node server-mongodb.js
```

**Phải thấy:**
```
✓ MongoDB connected
✓ API Server running on https://wordserver.local:3000
```

**⚠️ GIỮ TERMINAL NÀY MỞ!**

---

### Terminal 2: WebDAV Server

```bash
cd C:\Users\Admin\Desktop\word_add_in\server
node webdav-simple.js
```

**Phải thấy:**
```
✓ MongoDB connected
✓ WebDAV Server running on https://wordserver.local:3001
```

**⚠️ GIỮ TERMINAL NÀY MỞ!**

---

### Terminal 3: React Client

```bash
cd C:\Users\Admin\Desktop\word_add_in\client
npm run dev
```

**Phải thấy:**
```
VITE ready in 500ms
➜ Local: http://localhost:5173
```

**⚠️ GIỮ TERMINAL NÀY MỞ!**

---

## 5. TEST

### 5.1. Test Upload File

**Bước 1:** Mở browser
```
http://localhost:5173
```

**Bước 2:** Upload file Word
```
1. Click button "Upload File" hoặc "Chọn file"
2. Chọn file Word (.docx)
3. Click "Upload" hoặc "Tải lên"
4. Đợi upload xong
```

**Kết quả:**
```
✅ File xuất hiện trong danh sách
✅ Có thông tin: tên file, kích thước, ngày upload
✅ KHÔNG CÓ SSL ERROR!
```

---

### 5.2. Test Edit File

**Bước 1:** Click button "Chỉnh sửa" trên file vừa upload

**Bước 2:** Word Desktop tự động mở

**Kết quả mong đợi:**
```
✅ Word Desktop mở tự động (không cần chọn app)
✅ KHÔNG CÓ CẢNH BÁO SSL!
✅ KHÔNG CÓ DIALOG HỎI VỀ CERTIFICATE!
✅ File mở bình thường trong Word
```

**Bước 3:** Sửa nội dung văn bản

**Bước 4:** Nhấn Ctrl+S để save

**Kết quả:**
```
✅ Save thành công (không hỏi Save As)
✅ Không save vào máy local
✅ Save trực tiếp về server
```

**Bước 5:** Đóng Word

**Bước 6:** Refresh browser (F5)

**Kết quả:**
```
✅ Thấy nội dung đã thay đổi
✅ Download file → Kiểm tra → Nội dung mới đúng
```

---

### 5.3. Test Download File

```
1. Click button "Tải về" trên file
2. File tự động download
3. Mở file → Kiểm tra nội dung
4. ✅ Nội dung đúng!
```

---

## 6. TROUBLESHOOTING

### 6.1. Lỗi "Cannot connect to MongoDB"

**Nguyên nhân:** MongoDB service chưa chạy

**Giải pháp:**
```powershell
# PowerShell as Admin
net start MongoDB
```

---

### 6.2. Lỗi "Port 3000 already in use"

**Nguyên nhân:** API Server đang chạy rồi

**Giải pháp:**
```cmd
# Tắt process đang chạy
taskkill /f /im node.exe

# Hoặc tìm và tắt từng cái:
netstat -ano | findstr :3000
taskkill /f /pid <PID>
```

---

### 6.3. Vẫn có SSL warning khi upload

**Nguyên nhân:** Chưa chạy mkcert hoặc chưa restart

**Giải pháp:**
```powershell
# 1. Kiểm tra certificates đã tạo chưa
cd C:\Users\Admin\Desktop\word_add_in\certs
dir

# 2. Nếu chưa có, chạy lại mkcert
cd ..\word-setup-tool
.\mkcert.exe -install
.\mkcert.exe -cert-file ..\certs\wordserver.local.crt -key-file ..\certs\wordserver.local.key wordserver.local localhost 127.0.0.1 ::1

# 3. Restart máy
shutdown /r /t 0
```

---

### 6.4. Word mở file nhưng vẫn có SSL warning

**Nguyên nhân:** Registry chưa setup đầy đủ

**Giải pháp:**
```
1. Chạy lại Word Setup Tool (as Admin)
2. Restart máy
3. Test lại
```

---

### 6.5. Word không mở file, chỉ download

**Nguyên nhân:** `ms-word:ofe|u|` protocol chưa được register

**Giải pháp:**
```
1. Chạy lại Word Setup Tool (as Admin)
2. Restart máy
3. Hoặc: Kiểm tra Word đã cài chưa (Office 365/2016+)
```

---

### 6.6. Kiểm tra toàn bộ setup

**Chạy script kiểm tra:**

```bash
cd C:\Users\Admin\Desktop\word_add_in
.\CHECK_SIMPLE.bat
```

**Hoặc:**

```bash
Double-click file: CHECK_SIMPLE.bat
```

**Script sẽ kiểm tra:**
```
[1/6] Hosts file
[2/6] Trusted Locations
[3/6] Protected View
[4/6] Network Locations
[5/6] Certificates
[6/6] mkcert CA

→ Hiện kết quả: [OK] hoặc [ERROR]
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề không giải quyết được, chụp màn hình lỗi và gửi kèm:

1. Output của `CHECK_SIMPLE.bat`
2. Screenshot lỗi trên browser
3. Screenshot lỗi trên Word (nếu có)
4. Output của terminal servers (API, WebDAV, Client)

---

## ✅ CHECKLIST HOÀN TẤT

```
CÀI ĐẶT PHẦN MỀM:
□ MongoDB ✅
□ Node.js ✅
□ Git ✅
□ Microsoft Word ✅

LẤY CODE:
□ Clone từ Git ✅
□ npm install - server ✅
□ npm install - client ✅
□ npm install - word-setup-tool ✅

SETUP HỆ THỐNG:
□ Chạy Word Setup Tool (as Admin) ✅
□ Chạy mkcert (PowerShell as Admin) ✅
□ Kiểm tra certificates ✅
□ Restart máy ✅

CHẠY DỰ ÁN:
□ Start API Server ✅
□ Start WebDAV Server ✅
□ Start React Client ✅

TEST:
□ Upload file Word ✅
□ Edit file (Word mở) ✅
□ Ctrl+S (Save về server) ✅
□ Refresh browser → Thấy changes ✅
□ Download file → Kiểm tra nội dung ✅

🎉 HOÀN TẤT!
```
