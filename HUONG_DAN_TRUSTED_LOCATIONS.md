# 🔧 HƯỚNG DẪN SETUP TRUSTED LOCATIONS

## ✅ ĐÃ THÊM REGISTRY:
- DisableInternetFilesInPV = 1 (Tắt Protected View)
- DisableWebSavePrompt = 1 (Không hỏi Save As)

---

## 📋 KIỂM TRA TRUSTED LOCATIONS:

### Bước 1: Mở Word → Tệp → Tùy chọn

### Bước 2: Trung tâm Tin cậy → Cài đặt Trung tâm Tin cậy

### Bước 3: Vị trí đáng tin cậy

### Bước 4: Kiểm tra có Location nào với Path:
```
https://wordserver.local:3000
```

**NẾU KHÔNG CÓ → Cần thêm:**
1. Click "Thêm vị trí mới..."
2. Nhập Path: `https://wordserver.local:3000`
3. ✅ Tick: "Các thư mục con của vị trí này cũng được tin cậy"
4. ✅ Tick: "Cho phép các vị trí đáng tin cậy trên mạng của tôi"
5. OK → OK

**NẾU ĐÃ CÓ → Kiểm tra:**
- Path phải CHÍNH XÁC: `https://wordserver.local:3000`
- KHÔNG được có `/` ở cuối
- PHẢI có `https://`
- PHẢI có `:3000`
- 2 checkboxes phải được TICK ✅

---

## ⚠️ LƯU Ý QUAN TRỌNG:

### URL PHẢI KHỚP 100%:

**Dashboard mở từ:**
```
https://wordserver.local:3000/dashboard.html ✅
```

**File mở từ:**
```
https://wordserver.local:3000/api/documents/file.docx ✅
```

**Trusted Location:**
```
https://wordserver.local:3000 ✅
```

**KHÔNG ĐƯỢC:**
- Mở từ `https://localhost:3000` ❌
- Trusted Location thiếu `https://` ❌
- Trusted Location thiếu `:3000` ❌
- Trusted Location có `/` cuối: `https://wordserver.local:3000/` ❌

---

## 🧪 TEST:

### Sau khi setup xong:

1. **Đóng TẤT CẢ Word**
2. Mở Dashboard: `https://wordserver.local:3000/dashboard.html`
3. Click "✏️ Chỉnh sửa"
4. Word mở file

**KIỂM TRA:**
- ✅ Không có banner vàng "Protected View"
- ✅ Có thể chỉnh sửa ngay
- ✅ Ctrl+S → Không hiện Save As
- ✅ Chỉ thấy "Đang lưu..." rồi xong

**NẾU VẪN CÓ PROTECTED VIEW:**
→ Trusted Locations chưa đúng!
→ Làm lại từ đầu!

---

## 🔄 NẾU VẪN KHÔNG ĐƯỢC:

Thêm vào Trusted Sites (Internet Options):

1. Win + R → `inetcpl.cpl`
2. Tab "Security" → Trusted sites → Sites
3. Thêm: `https://wordserver.local`
4. OK → Apply → OK

Sau đó restart Word và test lại!
