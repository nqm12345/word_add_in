# 📘 Hướng dẫn sử dụng Word Server Editor

## 🎯 Mục đích
Add-in này giúp bạn mở và chỉnh sửa file Word trực tiếp từ server mà **KHÔNG CẦN** tải về máy.

## ⚡ Cách hoạt động

### Quy trình cũ (thủ công):
1. Tải file từ server về máy 📥
2. Mở file bằng Word 📄
3. Chỉnh sửa ✏️
4. Lưu file 💾
5. Upload lại lên server 📤

### Quy trình mới (với Add-in):
1. Mở Word Add-in 📂
2. Click "Mở trong Word" ✅
3. Chỉnh sửa ngay ✏️
4. Click "Lưu lên Server" 💾

**Tiết kiệm 4 bước! 🚀**

---

## 📦 Cài đặt lần đầu

### Bước 1: Cài đặt Node.js
1. Tải Node.js từ: https://nodejs.org
2. Cài đặt và khởi động lại máy tính

### Bước 2: Cài đặt ứng dụng
Mở PowerShell/CMD trong thư mục dự án và chạy:

```bash
# Cài đặt các package cần thiết
npm install

# Cài đặt certificate SSL cho localhost
npx office-addin-dev-certs install
```

### Bước 3: Khởi động server
```bash
npm start
```

Bạn sẽ thấy:
```
🚀 Server đang chạy tại https://localhost:3000
📁 Thư mục lưu trữ: D:\datv_word\server\documents
```

---

## 🔧 Cài đặt Add-in vào Word

### Cách 1: Sideload từ Shared Folder (Khuyên dùng cho development)

1. **Mở Word**

2. **Thêm manifest vào Shared Folder:**
   - Vào `File` → `Options` → `Trust Center` → `Trust Center Settings`
   - Chọn `Trusted Add-in Catalogs`
   - Trong ô `Catalog Url`, thêm đường dẫn: `D:\datv_word`
   - Click `Add catalog`
   - Đánh dấu ✅ vào `Show in Menu`
   - Click `OK` và restart Word

3. **Load Add-in:**
   - Mở Word
   - Vào tab `Insert` → `Get Add-ins` (hoặc `My Add-ins`)
   - Chọn `SHARED FOLDER`
   - Chọn `Word Server Editor`
   - Click `Add`

### Cách 2: Sideload bằng lệnh (Nhanh hơn)

```bash
npm run dev-client
```

Lệnh này sẽ tự động mở Word và load Add-in.

---

## 💡 Sử dụng hằng ngày

### 1️⃣ Mở file từ server

1. Mở Word
2. Click vào nút **"Mở File Server"** trên ribbon (tab Home)
3. Panel hiện ra bên phải
4. Chọn file muốn chỉnh sửa
5. Click **"📂 Mở trong Word"**
6. File sẽ tự động load vào document

### 2️⃣ Chỉnh sửa file

- Chỉnh sửa nội dung như bình thường
- Định dạng text, thêm hình ảnh, table, v.v.
- Tất cả tính năng Word đều hoạt động bình thường

### 3️⃣ Lưu file lên server

1. Trong panel Add-in, kéo xuống phần **"💾 Lưu File hiện tại"**
2. Tên file sẽ tự động điền (hoặc bạn có thể đổi tên)
3. Click **"💾 Lưu lên Server"**
4. Chờ thông báo **"✅ File đã được lưu thành công!"**

### 4️⃣ Upload file mới

1. Click **"Choose File"** trong phần **"📤 Upload File mới"**
2. Chọn file .docx từ máy
3. Click **"📤 Upload"**
4. File sẽ xuất hiện trong danh sách

### 5️⃣ Xóa file

1. Tìm file trong danh sách
2. Click nút **"🗑️ Xóa"**
3. Xác nhận xóa
4. File sẽ bị xóa khỏi server

---

## 🎨 Giao diện

### Panel chính gồm 3 phần:

```
┌─────────────────────────────────┐
│  📄 Quản lý File Word           │
│  Mở và lưu file trực tiếp      │
├─────────────────────────────────┤
│  📂 Danh sách File trên Server │
│  ┌───────────────────────────┐ │
│  │ 📄 document1.docx         │ │
│  │ 📂 Mở  │ 🗑️ Xóa          │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│  💾 Lưu File hiện tại          │
│  Tên file: [document1.docx]   │
│  [💾 Lưu lên Server]           │
├─────────────────────────────────┤
│  📤 Upload File mới            │
│  [Choose File] [📤 Upload]     │
└─────────────────────────────────┘
```

---

## 🔍 Khắc phục sự cố

### ❌ Add-in không hiển thị trong Word

**Nguyên nhân:** Certificate chưa được tin cậy

**Giải pháp:**
```bash
npx office-addin-dev-certs install
```
Sau đó restart Word.

---

### ❌ Không kết nối được server

**Kiểm tra:**
1. Server đã chạy chưa? → Chạy `npm start`
2. Kiểm tra console có lỗi không?
3. Thử truy cập: https://localhost:3000

**Nếu báo lỗi SSL:**
- Cài lại certificate: `npx office-addin-dev-certs install`

---

### ❌ File không lưu được

**Kiểm tra:**
1. Tên file có hợp lệ không? (không chứa ký tự đặc biệt)
2. File có quá lớn không? (giới hạn 50MB)
3. Kiểm tra quyền ghi vào folder `server/documents`

---

### ❌ Add-in bị "freeze" hoặc không phản hồi

**Giải pháp:**
1. Đóng Word
2. Xóa cache Office:
   - Windows: `C:\Users\[YourUsername]\AppData\Local\Microsoft\Office\16.0\Wef`
3. Mở lại Word và load lại Add-in

---

## 🎓 Tips & Tricks

### ✅ Auto-save
Add-in không có tính năng auto-save. Nhớ click "Lưu lên Server" sau khi chỉnh sửa.

### ✅ Làm việc offline
Bạn có thể chỉnh sửa file ngay cả khi server tạm ngưng, nhưng phải bật server mới lưu được.

### ✅ Quản lý phiên bản
Server ghi đè file cùng tên. Nếu muốn giữ phiên bản cũ, đổi tên file trước khi lưu.

### ✅ Làm mới danh sách
Click nút **"🔄 Làm mới danh sách"** để cập nhật danh sách file mới nhất.

---

## 🚀 Production Deployment

### Để triển khai cho nhiều người dùng:

1. **Thay đổi URL trong manifest.xml:**
   - Thay `localhost:3000` → `your-domain.com`
   - Cập nhật SSL certificate cho domain

2. **Deploy server lên cloud:**
   - Heroku, Azure, AWS, etc.
   - Cấu hình CORS cho phép domain của bạn

3. **Publish Add-in:**
   - Publish lên Microsoft AppSource
   - Hoặc deploy qua Office 365 Admin Center (cho tổ chức)

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra file `README.md`
2. Xem console log (F12 trong taskpane)
3. Kiểm tra server log

---

## ⭐ Tính năng nâng cao (có thể mở rộng)

- [ ] Hỗ trợ nhiều người chỉnh sửa cùng lúc (Real-time collaboration)
- [ ] Quản lý phiên bản (Version control)
- [ ] Quyền truy cập (Permission management)
- [ ] Preview file trước khi mở
- [ ] Tìm kiếm file theo tên

---

**Chúc bạn sử dụng hiệu quả! 🎉**
