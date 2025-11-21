# 💾 MONGODB INTEGRATION - Hướng dẫn đầy đủ

## ✨ Tại sao chuyển sang MongoDB?

### ❌ File System (Cũ):
- Chỉ lưu file .docx
- Không có metadata phong phú
- Khó search, filter
- Không scale được

### ✅ MongoDB + GridFS (Mới):
- Lưu file lớn hiệu quả (GridFS)
- Metadata phong phú (tags, user, version)
- Query mạnh mẽ
- Dễ scale
- Tích hợp được nhiều tính năng hơn

---

## 🎯 Kiến trúc MongoDB

```
MongoDB
├── Database: word_server_editor
│   ├── documents.files          ← GridFS metadata
│   ├── documents.chunks         ← GridFS file chunks
│   └── documents.metadata       ← Custom metadata (optional)
```

### GridFS Structure:

```javascript
// documents.files
{
  _id: ObjectId("..."),
  filename: "test.docx",
  length: 13072,
  chunkSize: 261120,
  uploadDate: ISODate("2025-11-21"),
  metadata: {
    uploadedBy: "user@email.com",
    tags: ["report", "2025"],
    originalName: "test.docx",
    mimeType: "application/vnd.openxmlformats..."
  }
}

// documents.chunks
{
  _id: ObjectId("..."),
  files_id: ObjectId("..."),  // Reference to files
  n: 0,                       // Chunk number
  data: Binary("...")         // File data
}
```

---

## 🚀 CÁCH SỬ DỤNG

### Option 1: Migrate data hiện tại (Khuyến nghị)

**Bước 1:** Stop server cũ
```bash
# Nhấn Ctrl+C trong terminal đang chạy server
```

**Bước 2:** Chạy migration
```bash
node migrate-to-mongodb.js
```

**Kết quả:**
```
🚀 Bắt đầu migrate dữ liệu...
✅ Đã kết nối MongoDB
📂 Đang quét thư mục: D:\datv_word\server\documents
✅ Tìm thấy 2 file .docx

📤 Uploading: test.docx (12 KB)...
   ✅ Success: 67445a1e2f3c9d8e7f...

══════════════════════════════════
📊 KẾT QUẢ MIGRATION:
══════════════════════════════════
✅ Thành công: 2 file
⏭️  Đã skip: 0 file
❌ Lỗi: 0 file
══════════════════════════════════

🎉 Migration hoàn tất!
```

**Bước 3:** Start server MongoDB
```bash
npm run start:mongo
```

**Kết quả:**
```
🔒 Sử dụng mkcert certificate (trusted by system)
✅ MongoDB connected: word_server_editor
✅ Indexes created
🚀 Server đang chạy tại https://localhost:3000
💾 Database: MongoDB (GridFS)
```

### Option 2: Start fresh (Không migrate)

```bash
# Chỉ cần start server MongoDB
npm run start:mongo

# Upload file mới qua web interface
```

---

## 📋 SCRIPTS AVAILABLE

```bash
# File System version (cũ)
npm start                    # Start server với file system
npm run dev                  # Dev mode với file system

# MongoDB version (mới)
npm run start:mongo          # Start server với MongoDB
npm run dev:mongo            # Dev mode với MongoDB

# Migration
node migrate-to-mongodb.js   # Migrate data từ file system → MongoDB
```

---

## 🔍 KIỂM TRA MONGODB

### Dùng MongoDB Compass:

1. **Mở MongoDB Compass**
2. **Connect to:** `mongodb://localhost:27017`
3. **Chọn database:** `word_server_editor`
4. **Xem collections:**
   - `documents.files` → Metadata của file
   - `documents.chunks` → Nội dung file (chunks)

### Xem file trong Compass:

```javascript
// Filter trong documents.files
{ filename: "test.docx" }

// Kết quả
{
  "_id": ObjectId("67445a1e2f3c9d8e7f123456"),
  "length": 13072,
  "chunkSize": 261120,
  "uploadDate": "2025-11-21T01:30:00.000Z",
  "filename": "test.docx",
  "metadata": {
    "uploadedBy": "user@email.com",
    "tags": ["report"]
  }
}
```

---

## 🎨 TÍNH NĂNG MỚI VỚI MONGODB

### 1. Metadata phong phú

```javascript
// Khi upload file
{
  uploadedBy: "user@email.com",
  tags: ["urgent", "report"],
  department: "IT",
  version: "1.0",
  description: "Q1 Report"
}
```

### 2. Search & Filter

```javascript
// Tìm file theo tags
db.documents.files.find({ "metadata.tags": "urgent" })

// Tìm file của user
db.documents.files.find({ "metadata.uploadedBy": "user@email.com" })

// Tìm file lớn hơn 1MB
db.documents.files.find({ length: { $gt: 1048576 } })
```

### 3. Versioning (Có thể mở rộng)

```javascript
// Lưu nhiều version của cùng 1 file
{
  filename: "report.docx",
  version: 1,
  metadata: { ... }
}
{
  filename: "report.docx",
  version: 2,
  metadata: { ... }
}
```

---

## 🐛 TROUBLESHOOTING

### Q: "MongoDB connection error"
**A:** Kiểm tra:
```bash
# Xem service MongoDB có chạy không
Get-Service MongoDB

# Start service nếu chưa chạy
Start-Service MongoDB
```

### Q: "Database not initialized"
**A:** 
- Server chưa kết nối MongoDB thành công
- Xem logs khi start server
- Kiểm tra connection string trong `server/database.js`

### Q: File không hiển thị sau khi migrate
**A:**
```bash
# Kiểm tra trong MongoDB Compass
# Database: word_server_editor
# Collection: documents.files

# Hoặc chạy lại migration
node migrate-to-mongodb.js
```

### Q: "GridFS bucket not found"
**A:**
- GridFS tự động tạo khi upload file đầu tiên
- Nếu vẫn lỗi, restart server

---

## 📊 SO SÁNH PERFORMANCE

| Tính năng | File System | MongoDB |
|-----------|-------------|---------|
| **Lưu trữ** | Disk trực tiếp | GridFS (chunked) |
| **Metadata** | File stats only | Rich metadata |
| **Search** | Filename only | Full-text, tags, user... |
| **Query** | ❌ Không có | ✅ MongoDB Query |
| **Versioning** | ❌ | ✅ Có thể |
| **Scalability** | ❌ Giới hạn | ✅ Dễ scale |
| **Backup** | Copy folder | MongoDB backup |

---

## 🎯 NEXT STEPS

### Có thể mở rộng thêm:

1. **User Management** - Đăng nhập, phân quyền
2. **Version Control** - Lưu lịch sử chỉnh sửa
3. **Tags & Categories** - Phân loại file
4. **Search** - Tìm kiếm nâng cao
5. **Analytics** - Thống kê usage
6. **Collaboration** - Real-time editing

---

## ✅ CHECKLIST SAU KHI CÀI

- [ ] MongoDB service đang chạy
- [ ] Package mongodb đã cài (`npm install`)
- [ ] Migration hoàn tất (nếu có data cũ)
- [ ] Server MongoDB chạy (`npm run start:mongo`)
- [ ] Web interface hoạt động
- [ ] Upload/Download file OK
- [ ] MongoDB Compass thấy data

---

**🎉 Chúc mừng! Bạn đã nâng cấp lên MongoDB thành công!** 🚀
