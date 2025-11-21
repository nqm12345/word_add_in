# 🚀 Hướng dẫn Setup nhanh

## Bước 1: Cài đặt Dependencies

```bash
npm install
```

## Bước 2: Cài đặt SSL Certificate

```bash
npx office-addin-dev-certs install
```

**Lưu ý:** Nếu hệ thống hỏi, chọn **Yes** để tin cậy certificate.

## Bước 3: Khởi động Server

### Cách 1: Dùng npm
```bash
npm start
```

### Cách 2: Dùng file .bat (Windows)
Double-click vào file `START.bat`

## Bước 4: Cấu hình Word Add-in

### Option A: Manual Load (Recommended)

1. Mở Word
2. File → Options → Trust Center → Trust Center Settings
3. Trusted Add-in Catalogs
4. Thêm: `D:\datv_word` (hoặc đường dẫn thư mục của bạn)
5. Check ✅ "Show in Menu"
6. OK và restart Word
7. Insert → My Add-ins → SHARED FOLDER → Word Server Editor

### Option B: Command Line (Quick)

```bash
npm run dev-client
```

## Bước 5: Test

1. Trong Word, click "Mở File Server" trên ribbon
2. Panel hiện ra bên phải
3. Upload một file .docx để test
4. Thử mở và chỉnh sửa file

## ✅ Kiểm tra

- [ ] Server chạy tại https://localhost:3000
- [ ] Add-in hiển thị trong Word
- [ ] Có thể upload file
- [ ] Có thể mở file trong Word
- [ ] Có thể lưu file lên server

## 🐛 Lỗi thường gặp

### "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### "Certificate not trusted"
```bash
npx office-addin-dev-certs install --machine
```

### Add-in không hiển thị
- Xóa cache: `%LOCALAPPDATA%\Microsoft\Office\16.0\Wef`
- Restart Word

## 🎯 Next Steps

Xem file `HUONG_DAN_SU_DUNG.md` để biết cách sử dụng chi tiết.
