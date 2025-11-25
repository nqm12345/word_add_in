# Word Editor - Edit Word files directly on server 📄

Hệ thống cho phép upload, download và chỉnh sửa file Word trực tiếp từ trình duyệt web, sử dụng Microsoft Word Desktop để edit 📊.

## ✨ Features

- 📤 Upload Word files (.docx) lên server
- 📥 Download files về máy
- ✏️ Edit files trực tiếp với Word Desktop (qua WebDAV)
- 💾 Auto-save về server khi Ctrl+S (không save local)
- 🔒 SSL/HTTPS được cấu hình tự động
- 🚀 Không cần OnlyOffice/LibreOffice - dùng Word Desktop có sẵn

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

**⭐ Xem file:** `HUONG_DAN_CAI_DAT_KHACH_HANG.md` - Hướng dẫn đầy đủ từng bước

**Files hướng dẫn:**
- 📘 **HUONG_DAN_CAI_DAT_KHACH_HANG.md** - Setup chi tiết đầy đủ
- 🔧 **word-setup-tool-wpf/** - App tự động setup (WPF, .NET 8)

### Tóm tắt Setup:

1. **Cài phần mềm:** MongoDB, Node.js, Git, Word Desktop
2. **Clone & install:** `git clone` → `npm install` (server, client)
3. **Download app:** Tải `WordSetupTool.exe` từ GitHub Releases
4. **Setup:** Chạy Word Setup Tool → TỰ ĐỘNG setup hosts, registry, SSL
5. **Restart máy:** Bắt buộc
6. **Start servers:** `npm start` (server) + `npm start` (client)

**→ Chi tiết xem `HUONG_DAN_CAI_DAT_KHACH_HANG.md`**

## 🎯 Sử Dụng

### Start All Servers

```bash
npm start
```

Sẽ chạy 2 servers:
- API + WebDAV Server: `https://wordserver.local:3000` + `:3001`
- React App: `http://localhost:3000`

### Mở React App

```
http://localhost:3000
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
1. Chạy lại `WordSetupTool.exe`
2. Restart máy

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
