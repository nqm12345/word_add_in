# Word Server Editor - Add-in

Ứng dụng Word Add-in cho phép chỉnh sửa file Word trực tiếp từ server mà không cần tải về.

## ✨ Tính năng

- 📂 **Xem danh sách file** trên server
- 📄 **Mở file Word** trực tiếp vào Word từ server
- 💾 **Lưu file** trực tiếp lên server
- 📤 **Upload file mới** lên server
- 🗑️ **Xóa file** từ server
- 🔄 **Đồng bộ tự động** - không cần tải về/upload thủ công

## 🚀 Cài đặt

### Yêu cầu
- Node.js (phiên bản 14 trở lên)
- Microsoft Word (Desktop hoặc Online)

### Các bước cài đặt

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Tạo SSL certificate cho localhost (chỉ cần làm 1 lần):**
```bash
npx office-addin-dev-certs install
```

3. **Khởi động server:**
```bash
npm start
```

Server sẽ chạy tại `https://localhost:3000`

## 📖 Hướng dẫn sử dụng

### Bước 1: Cài đặt Add-in vào Word

1. Mở Microsoft Word
2. Vào **File** → **Options** → **Trust Center** → **Trust Center Settings**
3. Chọn **Trusted Add-in Catalogs**
4. Thêm đường dẫn thư mục chứa `manifest.xml` vào danh sách
5. Restart Word

### Bước 2: Load Add-in

1. Trong Word, vào tab **Insert**
2. Chọn **My Add-ins**
3. Chọn **Shared Folder**
4. Chọn **Word Server Editor**

### Bước 3: Sử dụng

1. **Mở file từ server:**
   - Click vào tab "Server Editor" trên ribbon
   - Chọn file từ danh sách
   - Click "Mở trong Word"

2. **Chỉnh sửa:**
   - Chỉnh sửa nội dung như bình thường trong Word

3. **Lưu lại server:**
   - Nhập tên file (hoặc giữ nguyên)
   - Click "Lưu lên Server"

## 🔧 Cấu hình

### Thay đổi cổng server
Sửa file `server/server.js`:
```javascript
const PORT = 3000; // Thay đổi cổng ở đây
```

### Thay đổi thư mục lưu trữ
Mặc định file được lưu tại `server/documents/`. Để thay đổi, sửa:
```javascript
const STORAGE_DIR = path.join(__dirname, 'documents');
```

## 🛠️ Development

Chạy ở chế độ development với auto-reload:
```bash
npm run dev
```

## 📁 Cấu trúc thư mục

```
datv_word/
├── server/
│   ├── server.js          # Backend API server
│   └── documents/         # Thư mục lưu file Word
├── public/
│   ├── taskpane.html      # Giao diện chính
│   ├── taskpane.css       # Styling
│   ├── taskpane.js        # Logic xử lý
│   ├── commands.html      # Function file
│   └── assets/            # Icons
├── manifest.xml           # Word Add-in manifest
├── package.json
└── README.md
```

## 🔌 API Endpoints

- `GET /api/documents` - Lấy danh sách file
- `GET /api/documents/:filename` - Tải file
- `GET /api/documents/:filename/content` - Lấy nội dung file (Base64)
- `POST /api/documents/:filename` - Lưu/cập nhật file
- `POST /api/upload` - Upload file mới
- `DELETE /api/documents/:filename` - Xóa file

## 🐛 Troubleshooting

### Add-in không hiển thị
- Kiểm tra certificate đã được cài đặt chưa
- Xóa cache Office: `C:\Users\[User]\AppData\Local\Microsoft\Office\16.0\Wef`
- Restart Word

### Không kết nối được server
- Kiểm tra server đã chạy chưa (`npm start`)
- Kiểm tra firewall không chặn port 3000
- Kiểm tra CORS settings trong `server.js`

### File không lưu được
- Kiểm tra quyền ghi vào thư mục `server/documents/`
- Kiểm tra dung lượng file (giới hạn 50MB)

## 📝 License

MIT License

## 👨‍💻 Author

Developed for easy Word document management from server.
