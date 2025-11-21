# 🎯 SETUP WORD ADD-IN - AUTO-SAVE THẬT SỰ!

## ✅ CÁCH DUY NHẤT ĐỂ AUTO-SAVE VỚI WORD 365

Word Add-in cho phép Ctrl+S tự động lưu về MongoDB!

---

## 📋 CÁCH SETUP (5 PHÚT):

### Bước 1: Start server với Add-in enabled

```bash
npm run dev:mongo
```

Hoặc nếu đang chạy server-mongodb.js, chỉ cần:
- Server đã chạy tại: https://localhost:3000
- Manifest file: manifest.xml đã có sẵn

### Bước 2: Load Add-in vào Word

**Cách 1: Sideload thủ công (Dễ nhất)**

1. Mở Word (bất kỳ document nào)
2. Tab **Chèn** → Click **Bổ trợ**
3. Click **OFFICE BỔ TRỢ** (góc trên)
4. Tab **SHARED FOLDER** (bên trái)
5. Chọn **Word Server Editor**
6. Click **Add** / **Thêm**

**Cách 2: Command line (Nhanh hơn)**

```bash
npm run dev-client
```

Lệnh này sẽ tự động:
- Build manifest
- Sideload vào Word
- Mở Word với Add-in đã load

### Bước 3: Sử dụng Add-in

1. Word mở → Ribbon xuất hiện nút **"Show Taskpane"**
2. Click **Show Taskpane**
3. Panel bên phải hiện ra
4. Danh sách file từ MongoDB hiện ra
5. Click vào file → Nội dung load vào Word
6. Chỉnh sửa → **Ctrl+S** → Tự động lưu!

---

## 🎯 WORKFLOW VỚI ADD-IN:

```
Mở Word → Click "Show Taskpane"
   ↓
Panel hiện danh sách file
   ↓
Click file muốn edit
   ↓
Word load nội dung
   ↓
Chỉnh sửa bình thường
   ↓
Ctrl+S → Panel hiện "Đang lưu..."
   ↓
✅ File tự động cập nhật vào MongoDB!
   ↓
Click "Refresh" → Thấy file đã update
```

---

## ⚠️ LƯU Ý:

### Trust Office Add-in Catalog:

Nếu Word hỏi "Trust this add-in?":
- Click **Trust** / **Tin cậy**
- Add-in sẽ load

### Nếu Add-in không hiện:

1. Đóng Word
2. Xóa cache:
   ```
   %LOCALAPPDATA%\Microsoft\Office\16.0\Wef\
   ```
3. Mở Word lại
4. Load Add-in lại

---

## 🚀 ƯU ĐIỂM CỦA WORD ADD-IN:

✅ **Auto-save thật sự** - Ctrl+S lưu ngay
✅ **Không cần Trusted Locations**
✅ **Không cần WebDAV phức tạp**
✅ **Quản lý file ngay trong Word**
✅ **Xem danh sách file MongoDB**
✅ **Upload file mới từ Word**
✅ **Delete file từ Word**

---

## 📊 SO SÁNH:

| Tính năng | Dashboard + ms-word | Word Add-in |
|-----------|---------------------|-------------|
| Mở file | ✅ | ✅ |
| Chỉnh sửa | ✅ | ✅ |
| **Auto-save Ctrl+S** | ❌ Save As | ✅ **TỰ ĐỘNG** |
| Upload file | ✅ Dashboard | ✅ Add-in panel |
| Quản lý file | ✅ Dashboard | ✅ Add-in panel |
| Setup | ❌ Phức tạp | ✅ Đơn giản |

---

## 🎯 KẾT LUẬN:

**Word Add-in là GIẢI PHÁP TỐT NHẤT cho auto-save với Word 365!**

Bỏ qua Trusted Locations, WebDAV phức tạp.
Chỉ cần load Add-in → Ctrl+S tự động lưu!

---

## 🚀 BẮT ĐẦU NGAY:

```bash
# Terminal 1: Start server
npm run start:mongo

# Terminal 2: Load Add-in (tự động mở Word)
npm run dev-client
```

**Hoặc thủ công:**
1. Server đang chạy
2. Mở Word
3. Chèn → Bổ trợ → Shared Folder → Word Server Editor
4. Click Show Taskpane
5. Bắt đầu làm việc!
