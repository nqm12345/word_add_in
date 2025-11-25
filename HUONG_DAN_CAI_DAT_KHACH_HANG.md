# HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG - KHÁCH HÀNG

## 📋 MỤC LỤC
1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt phần mềm](#2-cài-đặt-phần-mềm)
3. [Lấy code và cài dependencies](#3-lấy-code-và-cài-dependencies)
4. [Setup hệ thống với Word Setup Tool](#4-setup-hệ-thống-với-word-setup-tool)
5. [Chạy dự án](#5-chạy-dự-án)
6. [Test](#6-test)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. YÊU CẦU HỆ THỐNG

```
✅ Windows 10/11 (64-bit)
✅ Microsoft Word 2016 / 2019 / 2021 / Microsoft 365
✅ 500 MB RAM trống
✅ 200 MB disk trống
✅ Quyền Administrator
```

---

## 2. CÀI ĐẶT PHẦN MỀM

### 2.1. MongoDB (Database)

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

### 2.2. Node.js (JavaScript Runtime)

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
node --version
npm --version
```

Phải thấy: `v20.x.x` và `10.x.x`

---

### 2.3. Git (Version Control)

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

### 2.4. Microsoft Word

```
✅ Phải có Microsoft Word Desktop đã cài sẵn
✅ Office 365 hoặc Office 2016 trở lên
✅ Không cần setup gì thêm (app sẽ tự cấu hình)
```

---

## 3. LẤY CODE VÀ CÀI DEPENDENCIES

### 3.1. Clone code từ GitHub

```bash
# Mở Command Prompt hoặc PowerShell
cd C:\Users\Admin\Desktop\
git clone https://github.com/nqm12345/word_add_in.git
cd word_add_in
```

---

### 3.2. Cài dependencies

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

---

## 4. SETUP HỆ THỐNG VỚI WORD SETUP TOOL

### 4.1. Download Word Setup Tool

**Bước 1:** Vào GitHub Releases
```
https://github.com/nqm12345/word_add_in/releases
```

**Bước 2:** Download file
```
WordSetupTool-v1.0.0.zip
```

**Bước 3:** Giải nén vào folder `word-setup-tool-wpf`
```
📁 word_add_in/
└── word-setup-tool-wpf/
    ├── WordSetupTool.exe    ← Giải nén vào đây
    └── mkcert.exe           ← Giải nén vào đây
```

---

### 4.2. Chạy Word Setup Tool

**Bước 1:** Chạy app
```
1. Double-click file WordSetupTool.exe
2. Windows hiện UAC popup → Click "Yes"
3. App Word Setup Tool mở lên
```

**Bước 2:** Chạy setup
```
1. Click button "🚀 BẮT ĐẦU SETUP"
2. Đợi 30-60 giây
3. Các bước hiện ✅ màu xanh
4. Thấy: "Setup hoàn tất!"
```

**App tự động làm:**
```
✅ Cấu hình hosts file (127.0.0.1 → wordserver.local)
✅ Tắt Protected View
✅ Thêm Trusted Location
✅ Enable Network Locations
✅ Cài đặt mkcert CA (SSL)
✅ Tạo SSL Certificates
```

**⚠️ KHÔNG CẦN LÀM THỦ CÔNG GÌ THÊM!**

---

### 4.3. Restart máy

**⚠️ BẮT BUỘC PHẢI RESTART!**

```powershell
shutdown /r /t 0
```

Hoặc: `Start → Power → Restart`

---

## 5. CHẠY DỰ ÁN

**SAU KHI RESTART MÁY, mở 2 terminals:**

### Terminal 1: Server (API + WebDAV)

```bash
cd C:\Users\Admin\Desktop\word_add_in\server
npm start
```

**Phải thấy:**
```
✓ MongoDB connected
✓ API Server running on https://wordserver.local:3000
✓ WebDAV Server running on https://wordserver.local:3001
```

**⚠️ GIỮ TERMINAL NÀY MỞ!**

---

### Terminal 2: React Client

```bash
cd C:\Users\Admin\Desktop\word_add_in\client
npm start
```

**Phải thấy:**
```
VITE ready in 500ms
➜ Local: http://localhost:3000
```

**⚠️ GIỮ TERMINAL NÀY MỞ!**

---

## 6. TEST

### 6.1. Test Upload File

**Bước 1:** Mở browser
```
http://localhost:3000
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

### 6.2. Test Edit File

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

### 6.3. Test Download File

```
1. Click button "Tải về" trên file
2. File tự động download
3. Mở file → Kiểm tra nội dung
4. ✅ Nội dung đúng!
```

---

## 7. TROUBLESHOOTING

### 7.1. Lỗi "Cannot connect to MongoDB"

**Nguyên nhân:** MongoDB service chưa chạy

**Giải pháp:**
```powershell
# PowerShell as Admin
net start MongoDB
```

---

### 7.2. Lỗi "Port 3000 already in use"

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

### 7.3. Vẫn có SSL warning khi upload

**Nguyên nhân:** Chưa chạy Word Setup Tool hoặc chưa restart

**Giải pháp:**
```
1. Kiểm tra folder certs/ có 2 files:
   - wordserver.local.crt
   - wordserver.local.key

2. Nếu không có, chạy lại Word Setup Tool:
   - Double-click WordSetupTool.exe
   - Click "BẮT ĐẦU SETUP"

3. RESTART MÁY

4. Test lại
```

---

### 7.4. Word mở file nhưng vẫn có SSL warning

**Nguyên nhân:** Registry chưa setup đầy đủ

**Giải pháp:**
```
1. Chạy lại Word Setup Tool (as Admin)
2. Restart máy
3. Test lại
```

---

### 7.5. Word không mở file, chỉ download

**Nguyên nhân:** `ms-word:ofe|u|` protocol chưa được register

**Giải pháp:**
```
1. Chạy lại Word Setup Tool (as Admin)
2. Restart máy
3. Hoặc: Kiểm tra Word đã cài chưa (Office 365/2016+)
```

---

### 7.6. Chạy lại Word Setup Tool

**Nếu gặp bất kỳ lỗi nào, thử chạy lại setup:**

```
1. Mở folder: word-setup-tool-wpf
2. Double-click: WordSetupTool.exe
3. Click "Yes" khi UAC hỏi
4. Click "🚀 BẮT ĐẦU SETUP"
5. Đợi hoàn tất
6. RESTART MÁY
7. Test lại
```

**App sẽ tự động kiểm tra và sửa:**
```
✅ Hosts file
✅ Trusted Locations
✅ Protected View
✅ Network Locations
✅ SSL Certificates
✅ mkcert CA
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề không giải quyết được, chụp màn hình lỗi và gửi kèm:

1. Screenshot kết quả của Word Setup Tool
2. Screenshot lỗi trên browser
3. Screenshot lỗi trên Word (nếu có)
4. Output của terminal servers

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

SETUP HỆ THỐNG:
□ Download WordSetupTool.zip từ GitHub Releases ✅
□ Giải nén vào word-setup-tool-wpf/ ✅
□ Chạy WordSetupTool.exe ✅
□ Click "BẮT ĐẦU SETUP" → Hoàn tất ✅
□ RESTART MÁY ✅

CHẠY DỰ ÁN:
□ npm start (server) ✅
□ npm start (client) ✅

TEST:
□ Upload file Word ✅
□ Edit file (Word mở) ✅
□ Ctrl+S (Save về server) ✅
□ Refresh browser → Thấy changes ✅
□ Download file → Kiểm tra nội dung ✅

🎉 HOÀN TẤT!
```
