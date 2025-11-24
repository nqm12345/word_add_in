# 🔄 LUỒNG HOẠT ĐỘNG DỰ ÁN WORD EDITOR

## 📋 MỤC LỤC
1. [Kiến Trúc Tổng Quan](#kiến-trúc-tổng-quan)
2. [Các Component](#các-component)
3. [Luồng Upload File](#luồng-upload-file)
4. [Luồng Download File](#luồng-download-file)
5. [Luồng Edit File Với Word Desktop](#luồng-edit-file-với-word-desktop)
6. [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
7. [Tại Sao Hoạt Động Được](#tại-sao-hoạt-động-được)

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────┐
│              USER (Browser)                      │
│          http://localhost:5173                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│         React Client (Vite)                      │
│              Port 5173                           │
│  - Upload files                                  │
│  - View document list                            │
│  - Download files                                │
│  - Open in Word Desktop                          │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓ HTTPS API Calls
┌─────────────────────────────────────────────────┐
│      API Server (Express.js)                     │
│    https://wordserver.local:3000                 │
│  - REST API endpoints                            │
│  - File upload/download                          │
│  - MongoDB integration                           │
│  - Launch ms-word:ofe|u| protocol                │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴─────────────┐
        │                        │
        ↓                        ↓
┌──────────────┐      ┌─────────────────────┐
│   MongoDB    │      │  WebDAV Server      │
│  Port 27017  │      │  Port 3001          │
│              │      │                     │
│ - Documents  │      │  - PROPFIND         │
│ - Metadata   │      │  - GET/PUT          │
│ - GridFS     │      │  - LOCK/UNLOCK      │
└──────────────┘      └─────────┬───────────┘
                                │
                                ↓
                      ┌─────────────────────┐
                      │  Word Desktop       │
                      │  (Local App)        │
                      │  - Edit documents   │
                      │  - Auto-save        │
                      └─────────────────────┘
```

---

## 🔧 CÁC COMPONENT

### **1. React Client (Port 5173)**
- **Công nghệ:** React + Vite + TailwindCSS
- **File chính:** `client/src/`
- **Chức năng:**
  - Upload files (Word, Excel, PDF)
  - Hiển thị danh sách documents
  - Download files
  - Mở file trong Word Desktop
  - Delete files

### **2. API Server (Port 3000)**
- **File:** `server/server-mongodb.js`
- **Công nghệ:** Express.js + HTTPS
- **Endpoints:**
  - `GET /api/documents` - Lấy danh sách files
  - `POST /api/upload` - Upload file mới
  - `GET /api/documents/:id/download` - Download file
  - `DELETE /api/documents/:id` - Xóa file
  - `POST /api/documents/:id/open-word` - Mở Word Desktop

### **3. WebDAV Server (Port 3001)**
- **File:** `server/webdav-simple.js`
- **Công nghệ:** Custom WebDAV + HTTPS
- **Methods:**
  - `PROPFIND` - Lấy file metadata
  - `GET` - Download file
  - `PUT` - Upload/Update file
  - `LOCK/UNLOCK` - Lock file khi edit

### **4. MongoDB (Port 27017)**
- **Database:** `word_editor`
- **Collections:**
  - `fs.files` - File metadata (GridFS)
  - `fs.chunks` - File content chunks (GridFS)

---

## 📤 LUỒNG UPLOAD FILE

### **Bước 1-7: User Upload File**

```
1. User chọn file trong browser
   ↓
2. React gửi POST /api/upload với FormData
   ↓
3. API Server nhận file (multer middleware)
   ↓
4. API lưu file vào MongoDB GridFS
   ↓
5. MongoDB chia file thành chunks (255KB/chunk)
   ↓
6. API trả về document info
   ↓
7. React cập nhật UI, hiện file mới
```

### **Code:**

```javascript
// Client - Upload
const formData = new FormData();
formData.append('file', selectedFile);
fetch('/api/upload', { method: 'POST', body: formData });

// Server - Receive & Save
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const uploadStream = bucket.openUploadStream(file.originalname);
  fs.createReadStream(file.path).pipe(uploadStream);
  // → File saved to MongoDB GridFS
});
```

---

## 📥 LUỒNG DOWNLOAD FILE

### **Bước 1-5: User Download File**

```
1. User click download button
   ↓
2. React gọi GET /api/documents/:id/download
   ↓
3. API tìm file trong MongoDB GridFS
   ↓
4. API stream file từ GridFS
   ↓
5. Browser download file
```

### **Code:**

```javascript
// Client
window.open(`/api/documents/${id}/download`);

// Server
app.get('/api/documents/:id/download', async (req, res) => {
  const downloadStream = bucket.openDownloadStream(ObjectId(id));
  downloadStream.pipe(res);
});
```

---

## 🌐 HOSTS FILE - TẠI SAO CẦN?

### **Hosts File Là Gì?**

```
File: C:\Windows\System32\drivers\etc\hosts

Chức năng:
- Map domain name → IP address
- Giống DNS nhưng local
- Windows check hosts file trước khi query DNS
```

### **Trong Dự Án Này:**

```
Content trong hosts file:
127.0.0.1   wordserver.local

Nghĩa là:
wordserver.local → 127.0.0.1 (localhost)
```

### **Tại Sao Cần?**

**1. SSL Certificate được tạo cho domain `wordserver.local`:**
```
- SSL cert không thể tạo cho IP (127.0.0.1)
- Phải tạo cho domain name
- Cert được tạo cho: wordserver.local
```

**2. Word Desktop yêu cầu HTTPS:**
```
- Word không chấp nhận HTTP cho WebDAV
- Word cần HTTPS với valid certificate
- URL phải match với cert: https://wordserver.local:3001
```

**3. Browser cũng cần domain:**
```
- Kết nối tới API: https://wordserver.local:3000
- Kết nối tới WebDAV: https://wordserver.local:3001
```

### **Nếu Không Có Hosts File:**

```
❌ Browser không biết wordserver.local
❌ Word không connect được WebDAV
❌ SSL certificate không match
❌ App không hoạt động!
```

### **Word Setup Tool Tự Động:**

```
Word Setup Tool (as Administrator):
1. Mở hosts file
2. Thêm dòng: 127.0.0.1  wordserver.local
3. Save file
4. Refresh DNS cache

→ Done! Domain hoạt động!
```

---

## ⭐ LUỒNG EDIT FILE VỚI WORD DESKTOP (QUAN TRỌNG NHẤT!)

### **TỔNG QUAN:**
```
User Click Edit → Launch ms-word:ofe|u| Protocol
→ Word Connect WebDAV Server → Download File
→ User Edit → Ctrl+S → Upload File
→ WebDAV Save MongoDB → Done!
```

---

### **VAI TRÒ CỦA MS-WORD:OFE|U| PROTOCOL**

#### **ms-word:ofe|u| là gì?**

```
ms-word:ofe|u|https://wordserver.local:3001/document.docx

Phân tích:
- ms-word:     Protocol cho Microsoft Word
- ofe          Office File Edit (chế độ edit)
- |u|          URL mode (file từ web, không phải local)
- https://...  WebDAV URL của file
```

#### **Nhiệm vụ của ms-word: protocol:**

**1. Mở Word Desktop thay vì Word Online:**
```
- Windows nhận URL với protocol ms-word:
- Check Registry: HKEY_CLASSES_ROOT\ms-word
- Tìm thấy đường dẫn tới WINWORD.EXE
- Launch Microsoft Word Desktop application
```

**2. Báo cho Word biết chế độ hoạt động:**
```
- ofe = Office File Edit (chế độ chỉnh sửa)
- Không phải chế độ view-only
- User có thể edit và save
```

**3. Báo cho Word biết file ở đâu:**
```
- |u| = URL mode
- File không phải trên local disk
- File ở trên web server
- Word phải download qua HTTP/HTTPS
```

**4. Kích hoạt WebDAV Client trong Word:**
```
- Word detect URL mode
- Tự động sử dụng WebDAV protocol
- Connect tới server để sync file
```

#### **Tại sao cần protocol này?**

```
Không có ms-word:ofe|u|:
❌ Click link → Mở browser
❌ File download về máy
❌ Phải save rồi upload lại
❌ Không real-time sync

Có ms-word:ofe|u|:
✅ Click link → Mở Word Desktop
✅ File mở trực tiếp từ server
✅ Ctrl+S → Tự động save lên server
✅ Real-time sync như Google Docs
```

---

### **VAI TRÒ CỦA WEBDAV PROTOCOL**

#### **WebDAV là gì?**

```
WebDAV = Web Distributed Authoring and Versioning

Là gì:
- Mở rộng của HTTP protocol
- Thêm các method để edit files từ xa
- Standard protocol (RFC 4918)
```

#### **Nhiệm vụ của WebDAV:**

**1. PROPFIND - Lấy thông tin file:**
```
Nhiệm vụ:
- Word hỏi: "File này có tồn tại không?"
- Word hỏi: "File này bao nhiêu byte?"
- Word hỏi: "File này được sửa lần cuối khi nào?"

WebDAV trả lời:
- Tên file: document.docx
- Size: 45678 bytes
- Last Modified: Thu, 21 Nov 2024 10:30:00 GMT

→ Word biết file tồn tại và metadata
```

**2. GET - Download file:**
```
Nhiệm vụ:
- Word yêu cầu: "Cho tôi nội dung file"
- WebDAV đọc file từ MongoDB
- WebDAV stream file về Word
- Word nhận toàn bộ nội dung file

→ Word có thể hiển thị file cho user
```

**3. LOCK - Khóa file:**
```
Nhiệm vụ:
- Word báo: "Tôi đang edit file này"
- WebDAV tạo lock token
- Ngăn người khác edit cùng lúc
- Tránh conflict khi save

→ Đảm bảo chỉ 1 người edit tại 1 thời điểm
```

**4. PUT - Upload file mới:**
```
Nhiệm vụ:
- User nhấn Ctrl+S
- Word gửi toàn bộ file mới lên server
- WebDAV nhận file
- WebDAV xóa version cũ
- WebDAV lưu version mới vào MongoDB

→ Changes được lưu lên server
```

**5. UNLOCK - Mở khóa file:**
```
Nhiệm vụ:
- Word đã save xong
- Word báo: "Tôi đã xong, người khác có thể edit"
- WebDAV xóa lock token
- File sẵn sàng cho người khác

→ File được unlock
```

#### **Tại sao cần WebDAV?**

```
Không có WebDAV:
❌ Không có cách sync file real-time
❌ Phải tự code protocol riêng
❌ Word không hiểu
❌ Không có lock mechanism

Có WebDAV:
✅ Standard protocol
✅ Word built-in hỗ trợ
✅ Automatic sync
✅ Lock/Unlock tự động
✅ Như edit file local
```

---

### **LUỒNG HOẠT ĐỘNG - 9 BƯỚC ĐơN GIẢN**

#### **BƯỚC 1: User Click "Edit"**
```
Browser tạo URL: ms-word:ofe|u|https://wordserver.local:3001/document.docx
→ Launch URL này
```

#### **BƯỚC 2: Windows Mở Word Desktop**
```
Windows: "Ai xử lý ms-word:?"
→ Registry: "Microsoft Word xử lý"
→ Launch WINWORD.EXE với URL
```

#### **BƯỚC 3: Word Gửi PROPFIND**
```
Word: "File này có không? Size bao nhiêu?"
→ WebDAV check MongoDB
→ WebDAV: "Có, 45KB, sửa lần cuối 10:30 AM"
```

#### **BƯỚC 4: Word Gửi GET**
```
Word: "Cho tôi nội dung file"
→ WebDAV đọc từ MongoDB
→ Stream file về Word
→ Word nhận toàn bộ file
```

#### **BƯỚC 5: Word Hiển Thị File**
```
Word parse DOCX
→ Render văn bản, hình ảnh, format
→ User thấy nội dung file
```

#### **BƯỚC 6: User Edit**
```
User gõ chữ, thêm hình, format text...
→ Word update document in-memory
→ Changes chỉ ở RAM
```

#### **BƯỚC 7: User Ctrl+S - SAVE**
```
7.1. Word gửi LOCK
     → WebDAV: "OK, file locked cho bạn"

7.2. Word gửi PUT (upload file mới)
     → WebDAV nhận file
     → WebDAV xóa version cũ trong MongoDB
     → WebDAV lưu version mới vào MongoDB
     → WebDAV: "Saved!"

7.3. Word gửi UNLOCK
     → WebDAV: "OK, file unlocked"
```

#### **BƯỚC 8: Word Báo Save Thành Công**
```
Word: "File saved" ✓
→ Title bar không còn dấu *
→ User yên tâm
```

#### **BƯỚC 9: User Refresh Browser**
```
Browser load lại danh sách
→ API query MongoDB
→ Thấy file với timestamp mới
→ Download file → Thấy changes!
```

---

### **TÓM TẮT VAI TRÒ:**

#### **ms-word:ofe|u| Protocol:**
```
✅ Launch Word Desktop (không phải browser)
✅ Báo Word: "Edit mode, file từ URL"
✅ Kích hoạt WebDAV client trong Word
✅ Cho phép real-time sync
```

#### **WebDAV Protocol:**
```
✅ PROPFIND: Check file metadata
✅ GET: Download file từ server
✅ LOCK: Khóa file khi edit
✅ PUT: Upload version mới
✅ UNLOCK: Mở khóa file
✅ Tất cả TỰ ĐỘNG, user chỉ cần Ctrl+S
```

#### **Kết hợp cả 2:**
```
ms-word:ofe|u| + WebDAV = MAGIC!

User trải nghiệm:
1. Click "Edit" trên web
2. Word mở file
3. Edit như file local
4. Ctrl+S
5. Done!

→ SIMPLE & POWERFUL!
```

---

## 🎯 SEQUENCE DIAGRAM CHI TIẾT

```
User    Browser    API Server    WebDAV Server    MongoDB    Word Desktop
│          │            │              │             │             │
│ Click    │            │              │             │             │
│ Edit     │            │              │             │             │
│─────────>│            │              │             │             │
│          │ Create     │              │             │             │
│          │ ms-word    │              │             │             │
│          │ URL        │              │             │             │
│          │────────────────────────────────────────────────────>│
│          │            │              │             │             │
│          │            │              │ PROPFIND    │             │
│          │            │              │<────────────────────────│
│          │            │              │             │             │
│          │            │              │ Find file   │             │
│          │            │              │────────────>│             │
│          │            │              │<────────────│             │
│          │            │              │             │             │
│          │            │              │─────────────────────────>│
│          │            │              │ 207 XML     │             │
│          │            │              │             │             │
│          │            │              │ GET         │             │
│          │            │              │<────────────────────────│
│          │            │              │             │             │
│          │            │              │ Download    │             │
│          │            │              │────────────>│             │
│          │            │              │ Read chunks │             │
│          │            │              │<────────────│             │
│          │            │              │             │             │
│          │            │              │─────────────────────────>│
│          │            │              │ 200 Stream  │             │
│          │            │              │             │             │
│          │            │              │             │             │ Display
│ See      │            │              │             │             │ content
│ content  │<──────────────────────────────────────────────────────│
│          │            │              │             │             │
│ Edit...  │            │              │             │             │
│──────────────────────────────────────────────────────────────>│
│          │            │              │             │             │
│ Ctrl+S   │            │              │             │             │
│──────────────────────────────────────────────────────────────>│
│          │            │              │             │             │
│          │            │              │ LOCK        │             │
│          │            │              │<────────────────────────│
│          │            │              │─────────────────────────>│
│          │            │              │ 200 Token   │             │
│          │            │              │             │             │
│          │            │              │ PUT         │             │
│          │            │              │<────────────────────────│
│          │            │              │ (new file)  │             │
│          │            │              │             │             │
│          │            │              │ Delete old  │             │
│          │            │              │────────────>│             │
│          │            │              │             │             │
│          │            │              │ Upload new  │             │
│          │            │              │────────────>│             │
│          │            │              │ Save chunks │             │
│          │            │              │<────────────│             │
│          │            │              │             │             │
│          │            │              │─────────────────────────>│
│          │            │              │ 204 OK      │             │
│          │            │              │             │             │
│          │            │              │ UNLOCK      │             │
│          │            │              │<────────────────────────│
│          │            │              │─────────────────────────>│
│          │            │              │ 204 OK      │             │
│          │            │              │             │             │
│ Saved!   │<──────────────────────────────────────────────────────│
│          │            │              │             │             │
│ Refresh  │            │              │             │             │
│─────────>│            │              │             │             │
│          │ GET        │              │             │             │
│          │ /api/docs  │              │             │             │
│          │───────────>│              │             │             │
│          │            │ List files   │             │             │
│          │            │──────────────────────────>│             │
│          │            │<──────────────────────────│             │
│          │<───────────│              │             │             │
│ See      │            │              │             │             │
│ updated! │            │              │             │             │
```

---

## 🔑 TẠI SAO HOẠT ĐỘNG ĐƯỢC?

### **1. ms-word:ofe|u| Protocol**

```
Microsoft định nghĩa protocol:
- ms-word: Protocol cho Word Desktop
- ofe: Office File Edit mode
- u: URL mode (web file, không phải local)

Word biết:
→ Connect tới URL qua HTTP/HTTPS
→ Sử dụng WebDAV protocol
→ Tự động sync changes
```

---

### **2. WebDAV Protocol**

```
WebDAV = Web Distributed Authoring and Versioning

Mở rộng HTTP:
- PROPFIND: Get metadata
- GET: Download
- PUT: Upload
- LOCK/UNLOCK: Prevent concurrent editing
- DELETE: Remove

→ Edit files on web như files local!
```

---

### **3. Word Built-in WebDAV Client**

```
Microsoft Word có WebDAV client:
✅ Tự động PROPFIND trước khi mở
✅ Tự động download qua GET
✅ Tự động lock khi edit
✅ Tự động upload qua PUT khi save
✅ Tự động unlock sau save

→ User chỉ cần Ctrl+S!
```

---

### **4. HTTPS + SSL Certificates**

```
Word yêu cầu HTTPS:
✅ Bảo mật dữ liệu
✅ Prevent attacks
✅ Trusted certificates

wordserver.local:
- Custom domain qua hosts file
- SSL cert cho domain
- Word trust certificate
```

---

### **5. MongoDB GridFS**

```
GridFS lưu large files:
✅ Split file → chunks (255KB/chunk)
✅ Collections: fs.files, fs.chunks
✅ Efficient streaming
✅ Versioning support
```

---

## 💻 CÔNG NGHỆ SỬ DỤNG

### **Backend:**
- Node.js - Runtime
- Express.js - Web framework
- MongoDB - Database
- GridFS - File storage
- WebDAV - Word protocol
- HTTPS - SSL/TLS
- Multer - File upload
- CORS - Cross-origin

### **Frontend:**
- React - UI framework
- Vite - Build tool
- TailwindCSS - Styling
- Fetch API - HTTP requests

### **Infrastructure:**
- Windows Service - MongoDB
- SSL Certificates - HTTPS
- Hosts File - Domain mapping
- Registry - Word settings

---

## 📊 PROTOCOLS & PORTS

```
Protocol         Port    Purpose
─────────────────────────────────────────
HTTP             5173    React Dev Server
HTTPS            3000    API Server
HTTPS            3001    WebDAV Server
MongoDB          27017   Database
ms-word:ofe|u|   -       Word Protocol
```

---

## ✅ TÓM TẮT LUỒNG CHÍNH

### **Upload:**
```
Browser → React → API → MongoDB GridFS
```

### **Download:**
```
Browser → React → API → MongoDB → Stream
```

### **Edit với Word:**
```
Browser → Launch ms-word:ofe|u|
→ Word → WebDAV → MongoDB
→ User Edit → Ctrl+S
→ Word → WebDAV → MongoDB
→ Done!
```

---

## 🎯 LUỒNG TÓM GỌN (10 BƯỚC)

```
1. User click Edit
2. Launch ms-word:ofe|u|https://wordserver.local:3001/file.docx
3. Word PROPFIND → Get metadata
4. Word GET → Download file
5. Word hiển thị nội dung
6. User edit trong Word
7. User Ctrl+S
8. Word LOCK → PUT → UNLOCK
9. WebDAV save to MongoDB
10. Done! File updated!
```

---

## 🌟 ĐIỂM QUAN TRỌNG

### **Tại sao Word có thể edit file từ server:**

1. **ms-word:ofe|u| protocol** - Word hiểu và connect
2. **WebDAV protocol** - Standard protocol cho file editing
3. **Word's WebDAV client** - Built-in, tự động sync
4. **HTTPS + SSL** - Bảo mật connection
5. **MongoDB GridFS** - Efficient file storage

**→ MAGIC:** Microsoft đã tích hợp sẵn WebDAV client vào Word! ✨

---

## 📞 HỖ TRỢ

Nếu có câu hỏi về luồng hoạt động, tham khảo:
- `server/server-mongodb.js` - API Server
- `server/webdav-simple.js` - WebDAV Server
- `client/src/services/api.js` - Client API calls
- `server/database.js` - MongoDB operations

---

**🎉 ĐÂY LÀ CÁCH DỰ ÁN HOẠT ĐỘNG!**
