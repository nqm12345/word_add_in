# ✅ Checklist - Kiểm tra setup

## Bước đã hoàn thành

- [x] ✅ Cài đặt dependencies (`npm install`)
- [x] ✅ Cài đặt SSL certificate
- [x] ✅ Server đang chạy tại https://localhost:3000

## Bước cần làm tiếp

- [ ] **Cấu hình Word Trust Center**
  - [ ] Mở Word
  - [ ] File → Options → Trust Center → Trust Center Settings
  - [ ] Trusted Add-in Catalogs
  - [ ] Thêm đường dẫn: `d:\datv_word`
  - [ ] Check "Show in Menu"
  - [ ] Click OK
  - [ ] Restart Word

- [ ] **Load Add-in vào Word**
  - [ ] Insert → My Add-ins
  - [ ] SHARED FOLDER
  - [ ] Chọn "Chỉnh sửa Word từ Server"
  - [ ] Click Add

- [ ] **Test Add-in**
  - [ ] Click "Mở File Server" trên ribbon
  - [ ] Panel hiện ra bên phải
  - [ ] Upload file .docx
  - [ ] Mở file trong Word
  - [ ] Chỉnh sửa nội dung
  - [ ] Lưu lên server

## 🎯 Khi hoàn thành tất cả

Bạn có thể:
- ✅ Mở file Word từ server
- ✅ Chỉnh sửa trực tiếp trong Word
- ✅ Lưu file lên server không cần download/upload
- ✅ Quản lý file (xem, xóa, upload)

## 📌 Lưu ý

- Server cần chạy khi sử dụng Add-in
- Chạy server: Double-click `START.bat` hoặc `npm start`
- Dừng server: Ctrl+C hoặc double-click `STOP.bat`

## 🔗 Tài liệu

- `QUICK_START.md` - Hướng dẫn nhanh
- `HUONG_DAN_SU_DUNG.md` - Hướng dẫn chi tiết
- `README.md` - Tài liệu kỹ thuật
