# Word Editor with WebDAV & MongoDB

Hệ thống quản lý và chỉnh sửa tài liệu Word với khả năng auto-save trực tiếp từ Word Desktop về server.

## ✨ Tính Năng

- ✅ **WebDAV Server** - Full implementation cho Word Desktop
- ✅ **MongoDB GridFS** - Lưu trữ files trong database
- ✅ **Auto-Save** - Ctrl+S trong Word tự động lưu về server
- ✅ **Dashboard** - Web UI quản lý files
- ✅ **HTTPS** - Secured với mkcert certificates
- ✅ **ms-word:ofe|u|** - Microsoft Office protocol

## 🏗️ Kiến Trúc

```
┌─────────────────────────────────────┐
│  React App (Vite)                   │
│  Port 5173 - Web UI                 │
│  - Upload files                     │
│  - Download files                   │
│  - Delete files                     │
│  - Open in Word (via WebDAV)        │
└────────────┬────────────────────────┘
             │
             ├─────────────────┬──────────────────┐
             │                 │                  │
             ↓                 ↓                  ↓
┌─────────────────────┐ ┌──────────────┐ ┌──────────────┐
│  API Server         │ │ WebDAV Server│ │ Word Desktop │
│  Port 3000 (HTTPS)  │ │ Port 3001    │ │              │
│  - List files       │ │ - PROPFIND   │ │ - Edit docs  │
│  - Upload           │ │ - GET        │ │ - Ctrl+S     │
│  - Download         │ │ - PUT        │ │ - Auto-save  │
│  - Delete           │ │ - LOCK       │ │              │
└──────────┬──────────┘ └───────┬──────┘ └──────┬───────┘
           │                    │                │
           └────────────────────┴────────────────┘
                              │
                              ↓
                   ┌────────────────────┐
                   │  MongoDB GridFS    │
                   │  Files Storage     │
                   └────────────────────┘
```

## 📋 Yêu Cầu

- Node.js 18+
- MongoDB 4.4+
- mkcert (cho HTTPS certificates)
- Windows với Word Desktop

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Axios
- Lucide React Icons

**Backend:**
- Node.js + Express
- Custom WebDAV Server
- MongoDB GridFS
- HTTPS (mkcert)

## 🚀 Cài Đặt

### ⚡ Quick Start (Người đã biết)

```bash
git clone https://github.com/nqm12345/word_add_in.git
cd word_add_in
npm run install-all
# Setup SSL, hosts, Word → Xem QUICK_START.md
npm start
```

### 📖 Hướng Dẫn Chi Tiết (Người mới)

**Xem file:** `SETUP_GUIDE.md` - Hướng dẫn đầy đủ từng bước

**Files hướng dẫn:**
- 📘 **SETUP_GUIDE.md** - Setup chi tiết đầy đủ (45 phút)
- ⚡ **QUICK_START.md** - Hướng dẫn nhanh (5 phút)
- 📋 **REQUIREMENTS.txt** - Yêu cầu hệ thống
- 🔧 **ADD_TRUSTED_LOCATION.ps1** - Script tự động setup Word

### Tóm tắt Setup:

1. **Cài phần mềm:** Node.js, MongoDB, mkcert
2. **Clone & install:** `npm run install-all`
3. **SSL certificates:** `mkcert wordserver.local`
4. **Hosts file:** Add `127.0.0.1 wordserver.local`
5. **Word setup:** Chạy `ADD_TRUSTED_LOCATION.ps1`
6. **Start:** `npm start`

**→ Chi tiết xem `SETUP_GUIDE.md`**

## 🎯 Sử Dụng

### Start All Servers

```bash
npm start
```

Sẽ chạy 3 servers:
- API Server: `https://wordserver.local:3000`
- WebDAV Server: `https://wordserver.local:3001`
- React App: `http://localhost:5173`

### Mở React App

```
http://localhost:5173
```

### Workflow

1. **Upload file:**
   - Click "Upload File"
   - Chọn file .docx
   - File lưu vào MongoDB

2. **Chỉnh sửa file:**
   - Click "✏️ Chỉnh sửa"
   - Word Desktop mở file
   - Edit content
   - **Ctrl+S** → Auto-save về server!

3. **Download file:**
   - Click "📥 Tải xuống"

4. **Xóa file:**
   - Click "🗑️ Xóa"

## 🔧 API Endpoints

### API Server (Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List all files |
| GET | `/api/documents/:filename` | Download file |
| POST | `/api/upload` | Upload file |
| DELETE | `/api/documents/:filename` | Delete file |

### WebDAV Server (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| OPTIONS | `/:filename` | Discovery |
| PROPFIND | `/:filename` | File properties |
| GET | `/:filename` | Download file |
| PUT | `/:filename` | Upload/Update file |
| LOCK | `/:filename` | Lock file |
| UNLOCK | `/:filename` | Unlock file |
| DELETE | `/:filename` | Delete file |

## 📖 Chi Tiết Kỹ Thuật

### WebDAV Implementation

Server implement full WebDAV methods theo RFC 4918:

- **PROPFIND**: Trả về XML với file properties (size, date, type)
- **LOCK/UNLOCK**: Simple locking mechanism cho Word
- **GET/PUT**: Download/Upload files từ MongoDB GridFS
- **DELETE**: Xóa files

### ms-word:ofe|u| Protocol

```javascript
const webdavUrl = 'https://wordserver.local:3001/filename.docx';
const msWordUrl = 'ms-word:ofe|u|' + webdavUrl;
window.location.href = msWordUrl;
```

Word Desktop flow:
1. OPTIONS → Kiểm tra server capabilities
2. PROPFIND → Lấy file info
3. LOCK → Khóa file
4. GET → Download file
5. Mở file ở edit mode
6. User edit → Ctrl+S
7. PUT → Upload file mới
8. UNLOCK → Mở khóa

### MongoDB GridFS

Files được lưu trong MongoDB GridFS:
- Chunks: 255KB per chunk
- Metadata: filename, uploadDate, metadata custom
- Efficient cho files lớn

## ⚠️ Troubleshooting

### Word mở file ở chế độ "chỉ đọc"

**Nguyên nhân:** Windows chưa trust WebDAV location

**Giải pháp:**
1. Chạy `ADD_TRUSTED_LOCATION.ps1`
2. Hoặc restart máy

### Ctrl+S không lưu về server

**Kiểm tra:**
- WebDAV server đang chạy?
- Terminal có log PUT request không?
- Trusted Location đã setup chưa?

### File không update trên Dashboard

**Giải pháp:** Refresh trang (F5)

## 📚 Tài Liệu Tham Khảo

- [WebDAV RFC 4918](https://tools.ietf.org/html/rfc4918)
- [MS Office Protocol](https://docs.microsoft.com/en-us/openspecs/office_protocols/ms-wdvmoduu)
- [MongoDB GridFS](https://docs.mongodb.com/manual/core/gridfs/)

## 📄 License

MIT

## 🤝 Contributing

Pull requests are welcome!

---

**Made with ❤️ for seamless Word editing**
