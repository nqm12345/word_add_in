# 📝 LUỒNG CHỈNH SỬA FILE WORD

> Tài liệu mô tả chi tiết từ khi người dùng click "Chỉnh sửa" đến khi lưu file thành công

---

## 🎯 TỔNG QUAN

Khi người dùng muốn chỉnh sửa file Word trên hệ thống:
1. **Không cần tải file về máy**
2. **Không cần upload lại sau khi sửa**
3. **Mọi thứ tự động** - chỉ cần click và Ctrl+S

---

## 📊 SƠ ĐỒ TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NGƯỜI DÙNG                                       │
│                                                                          │
│    1. Click "Chỉnh sửa"         7. Nhấn Ctrl+S                          │
│            │                          │                                  │
└────────────┼──────────────────────────┼─────────────────────────────────┘
             │                          │
             ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRÌNH DUYỆT WEB                                  │
│                                                                          │
│    2. Mở URL: ms-word:ofe|u|https://server/file.docx                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         WORD DESKTOP                                     │
│                                                                          │
│    3. Nhận URL                  8. Gửi PUT request                       │
│    4. Gửi GET request              (file mới)                           │
│    5. Nhận file                 9. Hiện "Đã lưu" ✓                       │
│    6. Mở file để edit                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
             │                          │
             ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         WEBDAV SERVER                                    │
│                                                                          │
│    handleGet()                  handlePut()                              │
│    - Tìm file trong DB          - Nhận file từ Word                     │
│    - Đọc nội dung               - Xóa file cũ                           │
│    - Trả về cho Word            - Lưu file mới                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
             │                          │
             ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MONGODB DATABASE                                 │
│                                                                          │
│    GridFS: Lưu trữ file Word (chia thành chunks 255KB)                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📖 MÔ TẢ CHI TIẾT TỪNG BƯỚC

---

### BƯỚC 1: NGƯỜI DÙNG CLICK "CHỈNH SỬA"

**Vị trí:** Trên giao diện web, trong danh sách file

**Hành động:** Click vào nút "Chỉnh sửa" màu xanh bên cạnh file

```
┌──────────────────────────────────────────────────────────────┐
│  Tên File              │ Kích thước │ Ngày upload │ Thao tác │
├──────────────────────────────────────────────────────────────┤
│  📄 Báo cáo Q1.docx    │ 45 KB      │ 26/11/2025  │ [Chỉnh sửa] [Tải xuống] [Xóa] │
│                                                     ↑                               │
│                                           Click vào đây                             │
└──────────────────────────────────────────────────────────────┘
```

**Code thực thi:**
```jsx
// File: client/src/components/FileList.jsx
<button onClick={() => onEdit(file.filename)}>
    Chỉnh sửa
</button>
```

---

### BƯỚC 2: TRÌNH DUYỆT TẠO URL VÀ MỞ WORD

**Điều gì xảy ra:**
- Hàm `handleEdit()` được gọi với tên file
- Tạo URL đặc biệt có dạng: `ms-word:ofe|u|https://...`
- Trình duyệt mở URL này

**Code thực thi:**
```javascript
// File: client/src/App.jsx
const handleEdit = (filename) => {
    // Tạo URL mở Word
    const msWordUrl = api.getMsWordUrl(filename);
    // Ví dụ: ms-word:ofe|u|https://wordserver.local:3001/Báo%20cáo%20Q1.docx
    
    // Mở URL → Windows sẽ mở Word Desktop
    window.location.href = msWordUrl;
};

// File: client/src/services/api.js
export function getMsWordUrl(filename) {
    const webdavUrl = `https://wordserver.local:3001/${encodeURIComponent(filename)}`;
    return `ms-word:ofe|u|${webdavUrl}`;
}
```

**Giải thích URL:**
```
ms-word:ofe|u|https://wordserver.local:3001/document.docx
   │     │ │  └──────────────────────────────────────────┘
   │     │ │                    │
   │     │ │         URL của file trên server
   │     │ │
   │     │ └── "u" = URL follows (có URL phía sau)
   │     │
   │     └── "ofe" = Office File Edit (mở để chỉnh sửa)
   │
   └── Protocol để Windows biết mở Microsoft Word
```

---

### BƯỚC 3: WINDOWS MỞ WORD DESKTOP

**Điều gì xảy ra:**
- Windows nhận được URL có protocol `ms-word:`
- Windows tự động mở Microsoft Word Desktop
- Truyền URL `https://wordserver.local:3001/document.docx` cho Word

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Windows Registry biết:                                   │
│    "ms-word:" → Mở C:\Program Files\Microsoft Office\...    │
│                                                             │
│    Word nhận được: https://wordserver.local:3001/file.docx  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### BƯỚC 4: WORD GỬI GET REQUEST ĐỂ TẢI FILE

**Điều gì xảy ra:**
- Word biết cần tải file từ URL
- Word gửi HTTP GET request đến WebDAV server
- Server tìm file trong database và trả về

**Request từ Word:**
```http
GET /Báo%20cáo%20Q1.docx HTTP/1.1
Host: wordserver.local:3001
```

**Code server xử lý:**
```javascript
// File: server/webdav-simple.js
async handleGet(res, fileName) {
    // 1. Tìm file trong MongoDB theo tên
    const file = await findFileByName(fileName);
    
    if (!file) {
        res.writeHead(404);
        res.end('File not found');
        return;
    }

    // 2. Đọc nội dung file từ database
    const fileBuffer = await downloadFile(file._id);
    
    // 3. Gửi file về cho Word
    res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Length': fileBuffer.length
    });
    res.end(fileBuffer);  // ← Binary data của file .docx
}
```

**Code database đọc file:**
```javascript
// File: server/database.js
async function downloadFile(fileId) {
    const chunks = [];
    const downloadStream = gridFSBucket.openDownloadStream(fileId);
    
    // Đọc từng phần (chunk) của file
    downloadStream.on('data', chunk => chunks.push(chunk));
    
    // Ghép tất cả chunks thành 1 file hoàn chỉnh
    downloadStream.on('end', () => {
        return Buffer.concat(chunks);  // ← File hoàn chỉnh
    });
}
```

---

### BƯỚC 5: WORD NHẬN FILE VÀ MỞ

**Điều gì xảy ra:**
- Word nhận binary data từ server
- Word lưu file vào bộ nhớ tạm (RAM hoặc Temp folder)
- Word mở file và hiển thị nội dung

```
┌─────────────────────────────────────────────────────────────┐
│                    Microsoft Word                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │   BÁO CÁO CÔNG VIỆC QUÝ 1 NĂM 2025                   │  │
│  │                                                        │  │
│  │   1. Tổng quan                                        │  │
│  │   Trong quý 1, công ty đã...                         │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  File đang mở từ: https://wordserver.local:3001/...         │
└─────────────────────────────────────────────────────────────┘
```

**Lưu ý quan trọng:**
- ✅ File KHÔNG được lưu vào ổ cứng của người dùng
- ✅ File chỉ ở trong bộ nhớ tạm
- ✅ Khi đóng Word mà không lưu → file tạm bị xóa

---

### BƯỚC 6: NGƯỜI DÙNG CHỈNH SỬA NỘI DUNG

**Hành động:** Người dùng tự do chỉnh sửa văn bản trong Word

```
┌─────────────────────────────────────────────────────────────┐
│                    Microsoft Word                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │   BÁO CÁO CÔNG VIỆC QUÝ 1 NĂM 2025                   │  │
│  │                        ↓                              │  │
│  │   [Người dùng thêm/sửa/xóa nội dung ở đây]           │  │
│  │                                                        │  │
│  │   1. Tổng quan                                        │  │
│  │   Trong quý 1, công ty đã HOÀN THÀNH XUẤT SẮC...     │  │
│  │                          ↑ (vừa thêm)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### BƯỚC 7: NGƯỜI DÙNG NHẤN CTRL+S ĐỂ LƯU

**Hành động:** Nhấn tổ hợp phím `Ctrl + S`

```
┌──────────────┐
│  Ctrl + S    │  →  Word gửi file mới lên server
└──────────────┘
```

**Điều đặc biệt:**
- ❌ KHÔNG hiện hộp thoại "Save As"
- ❌ KHÔNG lưu vào máy tính
- ✅ Lưu thẳng về server qua WebDAV

---

### BƯỚC 8: WORD GỬI PUT REQUEST ĐỂ LƯU FILE

**Điều gì xảy ra:**
- Word đóng gói toàn bộ nội dung file mới
- Word gửi PUT request đến server
- Request chứa binary data của file trong body

**Request từ Word:**
```http
PUT /Báo%20cáo%20Q1.docx HTTP/1.1
Host: wordserver.local:3001
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Length: 48592

[Binary data của file .docx - 48592 bytes]
```

**Code server xử lý:**
```javascript
// File: server/webdav-simple.js
async handlePut(req, res, fileName) {
    const chunks = [];
    
    // 1. Nhận data từ Word (có thể đến theo nhiều phần)
    req.on('data', chunk => chunks.push(chunk));

    // 2. Khi nhận xong toàn bộ
    req.on('end', async () => {
        // Ghép các phần thành file hoàn chỉnh
        const buffer = Buffer.concat(chunks);
        
        // 3. Xóa file cũ trong database
        const existingFile = await findFileByName(fileName);
        if (existingFile) {
            await deleteFile(existingFile._id);
        }

        // 4. Lưu file mới vào database
        await uploadFile(buffer, fileName, {
            uploadedBy: 'Word Desktop',
            source: 'WebDAV',
            updatedAt: new Date()
        });

        // 5. Báo Word: OK, đã lưu thành công!
        res.writeHead(204);  // 204 = No Content = Thành công
        res.end();
    });
}
```

---

### BƯỚC 9: DATABASE LƯU FILE MỚI

**Điều gì xảy ra:**
- File cũ bị xóa khỏi MongoDB
- File mới được lưu vào MongoDB GridFS
- GridFS chia file thành các chunks 255KB để lưu trữ hiệu quả

**Code database:**
```javascript
// File: server/database.js

// Xóa file cũ
async function deleteFile(fileId) {
    await gridFSBucket.delete(fileId);
}

// Lưu file mới
async function uploadFile(fileBuffer, filename, metadata) {
    // Mở stream upload vào GridFS
    const uploadStream = gridFSBucket.openUploadStream(filename, {
        metadata: {
            ...metadata,
            uploadDate: new Date(),
            size: fileBuffer.length
        }
    });
    
    // Ghi data vào database
    uploadStream.end(fileBuffer);
    
    // Đợi upload xong
    uploadStream.on('finish', () => {
        console.log('✅ File saved:', filename);
    });
}
```

**Cấu trúc lưu trong MongoDB:**
```
┌─────────────────────────────────────────────────────────────┐
│  Collection: documents.files                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ {                                                        ││
│  │   _id: ObjectId("..."),                                 ││
│  │   filename: "Báo cáo Q1.docx",                          ││
│  │   length: 48592,                                        ││
│  │   uploadDate: "2025-11-26T08:30:00Z",                   ││
│  │   metadata: {                                           ││
│  │     uploadedBy: "Word Desktop",                         ││
│  │     source: "WebDAV"                                    ││
│  │   }                                                     ││
│  │ }                                                        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Collection: documents.chunks                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ { files_id: ..., n: 0, data: BinData(255KB) }          ││
│  │ { files_id: ..., n: 1, data: BinData(phần còn lại) }   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

### BƯỚC 10: WORD HIỂN THỊ "ĐÃ LƯU"

**Điều gì xảy ra:**
- Server trả về HTTP 204 (thành công)
- Word nhận response và hiện thông báo đã lưu

```
┌─────────────────────────────────────────────────────────────┐
│                    Microsoft Word                            │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  ✓ Đã lưu vào wordserver.local                      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Thanh tiêu đề: Báo cáo Q1.docx - Word                      │
│                 (không có dấu * = không có thay đổi chưa lưu)│
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ KẾT QUẢ CUỐI CÙNG

Sau khi hoàn tất:

| Trước | Sau |
|-------|-----|
| File cũ trên server | File mới (đã cập nhật) trên server |
| Nội dung gốc | Nội dung đã chỉnh sửa |

**Người dùng có thể:**
- Refresh trang web → Thấy file đã cập nhật
- Download file → Nhận được bản mới nhất
- Chia sẻ link → Người khác thấy nội dung mới

---

## 📋 TÓM TẮT 1 CÂU

> **Click "Chỉnh sửa" → Word mở file từ server → Sửa nội dung → Ctrl+S → File tự động lưu về server**

---

## 🔑 ĐIỂM QUAN TRỌNG CẦN NHỚ

1. **Không cần tải file về máy** - Word tải trực tiếp từ server vào bộ nhớ
2. **Không cần upload lại** - Ctrl+S gửi thẳng về server
3. **Cần cài đặt 1 lần** - Chạy Word Setup Tool để cấu hình Word tin tưởng server
4. **Cần HTTPS** - Server phải có SSL certificate hợp lệ
5. **Chỉ hoạt động với Word Desktop** - Không hoạt động với Word Online

---

*Tài liệu này mô tả flow của hệ thống Word Editor với WebDAV*
