# 📋 TỔNG HỢP LỖI & CÁCH FIX

## 🔴 CÁC LỖI ĐÃ GẶP KHI TRIỂN KHAI

### **LỖI 1: Word Setup Tool bị stuck ở "Updating registry settings"**

**Triệu chứng:**
```
- App hiện progress: "Updating registry settings"
- Xoay mãi không xong
- PowerShell terminal hiện "DONE!" nhưng app không phản hồi
- Phải đóng app thủ công
```

**Nguyên nhân:**
```
PowerShell script có lệnh `pause` ở cuối
→ Script đợi user nhấn Enter
→ Electron app đợi script kết thúc
→ App bị stuck vô thời hạn
```

**Fix:**
```powershell
# XÓA dòng này:
pause

# THAY BẰNG:
# pause - Removed: Causes Electron app to hang waiting for script to finish
```

**Đã áp dụng:** ✅ Commit 8011881

---

### **LỖI 2: Browser không upload được file - ERR_CERT_AUTHORITY_INVALID**

**Triệu chứng:**
```
- Click "Chọn tệp" để upload
- Chọn file .docx
- Upload thất bại
- Console hiển thị:
  Failed to load resource: net::ERR_CERT_AUTHORITY_INVALID
  https://wordserver.local:3000/api/upload
```

**Nguyên nhân:**
```
SSL certificate là self-signed (tự ký)
→ Browser không tin tưởng
→ Block tất cả HTTPS requests tới wordserver.local
```

**Fix:**
```
User phải accept certificate thủ công:

1. Mở browser, vào: https://wordserver.local:3000
   → Cảnh báo hiện ra
   → Click "Advanced" → "Proceed to wordserver.local (unsafe)"

2. Mở tab mới, vào: https://wordserver.local:3001
   → Click "Advanced" → "Proceed to wordserver.local (unsafe)"

3. Quay lại web app, refresh (F5)

4. Upload file → ✅ OK!
```

**Script hỗ trợ:**
```batch
accept-certificates.bat
→ Tự động mở 2 URLs
→ User chỉ cần click "Advanced" → "Proceed"
```

**Đã áp dụng:** ✅ Commit f9de5ff, 2d92078

---

### **LỖI 3: Word hiện cảnh báo SSL mỗi khi mở file**

**Triệu chứng:**
```
- Click "Edit" trên web
- Word Desktop mở
- Hiện popup: "Microsoft Word Security Warning"
- "The security certificate was issued by a company you have not chosen to trust"
- User phải click "Yes" mỗi lần
```

**Nguyên nhân:**
```
SSL certificate không có trong Trusted Root Certification Authorities
→ Word coi certificate là không an toàn
→ Hỏi user mỗi lần mở file
```

**Fix:**
```powershell
# Thêm vào PowerShell script:
# Import certificate to Trusted Root
$certPath = "certs\wordserver.local.crt"
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath)
$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
$store.Open("ReadWrite")
$store.Add($cert)
$store.Close()
```

**Kết quả:**
```
✅ Certificate trong Trusted Root
✅ Word không hiện cảnh báo nữa
✅ Mở file trực tiếp
```

**Đã áp dụng:** ✅ Commit 30788c1

---

### **LỖI 4: Word save file vào local cache thay vì WebDAV server** ⚠️ NGHIÊM TRỌNG

**Triệu chứng:**
```
- Click "Edit" → Word mở file
- User edit nội dung
- Ctrl+S để save
- Word hiện "Save As" dialog
- Đường dẫn: \\C:\Users\...\AppData\Local\...
- File được save vào local cache
- ❌ Server KHÔNG nhận được file update
```

**Nguyên nhân:**
```
Registry chỉ có Trusted Location cho port 3000 (API)
→ Không có cho port 3001 (WebDAV)
→ Word không trust WebDAV server
→ Không dùng WebDAV protocol
→ Save file vào local cache thay vì PUT về server
```

**Fix:**
```powershell
# 1. Thêm Trusted Location cho WebDAV (port 3001)
$location98Path = "HKCU:\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\Location98"
Set-ItemProperty -Path $location98Path -Name "Path" -Value "https://wordserver.local:3001/"
Set-ItemProperty -Path $location98Path -Name "Description" -Value "Word WebDAV Server"
Set-ItemProperty -Path $location98Path -Name "AllowSubFolders" -Value 1

# 2. Enable web folders
$webClientPath = "HKCU:\Software\Microsoft\Office\16.0\Common\Internet"
Set-ItemProperty -Path $webClientPath -Name "UseOnlineContent" -Value 1
```

**Kết quả:**
```
✅ Word trust cả 2 ports (3000 + 3001)
✅ Word dùng WebDAV protocol
✅ Ctrl+S → PUT file về server
✅ File update trên server
```

**Đã áp dụng:** ✅ Commit 30788c1

---

## 📦 TẤT CẢ FIX ĐÃ GÓI VÀO WORD SETUP TOOL

### **PowerShell Script: ADD_TRUSTED_LOCATION.ps1**

```
[1/6] Installing SSL Certificate
      ✅ Import vào Trusted Root
      ✅ Fix cảnh báo SSL trong Word

[2/6] Disabling Protected View
      ✅ Tắt Protected View
      ✅ Mở file từ internet trực tiếp

[3/6] Enabling Network Locations
      ✅ Cho phép Word mở file từ network/URL

[4/6] Adding Trusted Locations
      ✅ Location99: https://wordserver.local:3000/ (API)
      ✅ Location98: https://wordserver.local:3001/ (WebDAV)
      ✅ UseOnlineContent = 1 (Web folders)

[5/6] Killing Word Processes
      ✅ Đóng tất cả Word đang chạy
      ✅ Registry changes có hiệu lực

[6/6] Verifying
      ✅ Check tất cả settings
      ✅ Hiển thị kết quả
```

---

## ✅ CÁCH SỬ DỤNG (CHO KHÁCH HÀNG)

### **Bước 1: Chạy Word Setup Tool**

```bash
cd word-setup-tool

# PowerShell as Administrator
npm start

# Hoặc .exe (nếu đã build)
# Right-click: Run as Administrator
```

**App sẽ tự động:**
```
✅ Setup hosts file (wordserver.local)
✅ Install SSL certificate
✅ Config Word Registry (6 bước)
✅ Verify settings
✅ Done!
```

---

### **Bước 2: Accept SSL trong Browser (1 lần duy nhất)**

**Tự động (dùng script):**
```batch
accept-certificates.bat

→ 2 tabs tự động mở
→ Tab 1: Advanced → Proceed to wordserver.local
→ Tab 2: Advanced → Proceed to wordserver.local
```

**Thủ công:**
```
1. https://wordserver.local:3000
   → Advanced → Proceed

2. https://wordserver.local:3001
   → Advanced → Proceed
```

---

### **Bước 3: Restart Computer**

```
⚠️ QUAN TRỌNG!

Registry changes cần restart để có hiệu lực 100%
```

---

### **Bước 4: Test**

```
1. Chạy 3 servers:
   - node server/server-mongodb.js
   - node server/webdav-simple.js
   - npm run dev (trong client/)

2. Mở browser: http://localhost:5173

3. Upload file .docx

4. Click "Edit"

5. Word mở file ✅

6. Edit → Ctrl+S ✅

7. Refresh browser → Thấy changes ✅
```

---

## 🎯 CHECKLIST HOÀN CHỈNH

```
Setup lần đầu:
□ Cài Node.js, MongoDB, Git
□ Clone code từ GitHub
□ npm install (client + word-setup-tool)
□ Chạy Word Setup Tool (as Admin)
□ Accept SSL trong browser
□ Restart computer
□ Test upload & edit

Kết quả mong đợi:
✅ Upload file → OK
✅ Download file → OK
✅ Edit trong Word Desktop → OK
✅ Ctrl+S → Auto-save → OK
✅ Không có cảnh báo SSL
✅ File update trên server
```

---

## 📊 TỔNG KẾT

### **Tổng số lỗi đã fix: 4**

```
1. ✅ App stuck → Xóa pause
2. ✅ Upload fail → Accept certificates
3. ✅ SSL warning → Install cert to Trusted Root
4. ✅ Save to cache → Add WebDAV Trusted Location
```

### **Tổng số commits: 4**

```
1. 8011881 - Fix pause command
2. f9de5ff - Add accept-certificates.bat
3. 2d92078 - Add HUONG_DAN_ACCEPT_CERT.txt
4. 30788c1 - Add WebDAV Trusted Location + SSL cert install
```

### **Tất cả đã gói vào Word Setup Tool: ✅**

```
✅ PowerShell script hoàn chỉnh (6 steps)
✅ Electron app UI
✅ Scripts hỗ trợ
✅ Tài liệu hướng dẫn
```

---

## 🚀 READY FOR PRODUCTION!

Dự án đã sẵn sàng triển khai cho khách hàng!
