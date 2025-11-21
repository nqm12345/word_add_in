# ⚡ Quick Start - Bắt đầu ngay

## ✅ Server đã chạy!

Server đang hoạt động tại: **https://localhost:3000**

---

## 🚀 Cách load Add-in vào Word (3 phút)

### Bước 1: Mở Word
Mở **Microsoft Word** (phiên bản desktop)

### Bước 2: Cấu hình Trust Center
1. **File** → **Options** → **Trust Center** → **Trust Center Settings**
2. Chọn **Trusted Add-in Catalogs**
3. Nhập vào ô "Catalog Url": 
   ```
   d:\datv_word
   ```
4. Click **Add catalog**
5. ✅ Check **"Show in Menu"**
6. Click **OK**
7. **Đóng và mở lại Word**

### Bước 3: Load Add-in
1. Trong Word, vào **Insert** → **Get Add-ins** (hoặc **My Add-ins**)
2. Chọn **SHARED FOLDER**
3. Chọn **"Chỉnh sửa Word từ Server"**
4. Click **Add**

### Bước 4: Sử dụng
1. Trên ribbon Word (tab **Home**), tìm group **"Server Editor"**
2. Click nút **"Mở File Server"**
3. Panel sẽ hiện ra bên phải
4. Upload file .docx để test
5. Click **"Mở trong Word"**
6. Chỉnh sửa và click **"Lưu lên Server"**

---

## 🧪 Test không cần Word (xem giao diện)

Mở browser và truy cập: **https://localhost:3000**

*(Lưu ý: Các tính năng Office.js chỉ hoạt động trong Word)*

---

## 📁 Upload file để test

Bạn có thể:
1. Copy file .docx vào thư mục: `d:\datv_word\server\documents\`
2. Hoặc dùng tính năng Upload trong Add-in

---

## 🐛 Troubleshooting

### Add-in không hiển thị?
1. Xóa cache Office:
   ```
   C:\Users\[YourName]\AppData\Local\Microsoft\Office\16.0\Wef
   ```
2. Restart Word

### Lỗi certificate?
```bash
npx office-addin-dev-certs install
```

### Server không chạy?
```bash
npm start
```

---

## 📞 Cần trợ giúp?

Xem file chi tiết:
- `HUONG_DAN_SU_DUNG.md` - Hướng dẫn đầy đủ
- `README.md` - Tài liệu kỹ thuật
- `SETUP.md` - Cài đặt

---

**🎉 Chúc bạn thành công!**
