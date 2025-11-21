const express = require('express');
const https = require('https');
const cors = require('cors');
const path = require('path');
const fsSync = require('fs');
const multer = require('multer');
const os = require('os');
const { ObjectId } = require('mongodb');

// Import database module
const {
    connectDB,
    uploadFile,
    downloadFile,
    deleteFile,
    listFiles,
    findFileByName,
    updateFileMetadata
} = require('./database');

const app = express();
const PORT = 3000;

// SSL certificate
const mkcertPath = path.join(__dirname, '..', 'certs', 'wordserver.local');
const defaultCertPath = path.join(os.homedir(), '.office-addin-dev-certs');

let options;
if (fsSync.existsSync(mkcertPath + '.key') && fsSync.existsSync(mkcertPath + '.crt')) {
    console.log('🔒 Sử dụng mkcert certificate (trusted by system)');
    options = {
        key: fsSync.readFileSync(mkcertPath + '.key'),
        cert: fsSync.readFileSync(mkcertPath + '.crt')
    };
} else {
    console.log('🔒 Sử dụng office-addin-dev-certs (self-signed)');
    options = {
        key: fsSync.readFileSync(path.join(defaultCertPath, 'localhost.key')),
        cert: fsSync.readFileSync(path.join(defaultCertPath, 'localhost.crt'))
    };
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Cấu hình multer cho upload (memory storage để upload vào MongoDB)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// ==================== API ENDPOINTS ====================

// API: Lấy danh sách file
app.get('/api/documents', async (req, res) => {
    try {
        const files = await listFiles({}, { sort: { uploadDate: -1 } });
        
        const documents = files.map(file => ({
            id: file._id.toString(),
            name: file.filename,
            size: file.length,
            modified: file.uploadDate,
            uploadedBy: file.metadata?.uploadedBy || 'Unknown',
            tags: file.metadata?.tags || [],
            path: `/api/documents/${file.filename}`
        }));
        
        res.json(documents);
    } catch (error) {
        console.error('Error listing documents:', error);
        res.status(500).json({ error: 'Không thể tải danh sách file' });
    }
});

// API: Tải file cụ thể (by filename)
app.get('/api/documents/:filename', async (req, res) => {
    try {
        const file = await findFileByName(req.params.filename);
        
        if (!file) {
            return res.status(404).json({ error: 'File không tồn tại' });
        }
        
        const fileBuffer = await downloadFile(file._id);
        
        // Headers cho Word nhận diện đây là server document (không phải download)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(fileBuffer);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Không thể tải file' });
    }
});

// API: Tải file theo ID
app.get('/api/documents/id/:id', async (req, res) => {
    try {
        const fileId = new ObjectId(req.params.id);
        const fileBuffer = await downloadFile(fileId);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(fileBuffer);
    } catch (error) {
        console.error('Error downloading document by ID:', error);
        res.status(404).json({ error: 'File không tồn tại' });
    }
});

// API: Lấy nội dung file dạng Base64
app.get('/api/documents/:filename/content', async (req, res) => {
    try {
        const file = await findFileByName(req.params.filename);
        
        if (!file) {
            return res.status(404).json({ error: 'File không tồn tại' });
        }
        
        const fileBuffer = await downloadFile(file._id);
        const base64Content = fileBuffer.toString('base64');
        
        res.json({
            filename: file.filename,
            content: base64Content,
            size: file.length
        });
    } catch (error) {
        console.error('Error reading document content:', error);
        res.status(500).json({ error: 'Không thể đọc nội dung file' });
    }
});

// API: Lưu/Cập nhật nội dung file
app.post('/api/documents/:filename/content', async (req, res) => {
    try {
        const filename = req.params.filename;
        const fileBuffer = req.body;
        
        // Kiểm tra file đã tồn tại chưa
        const existingFile = await findFileByName(filename);
        
        if (existingFile) {
            // Xóa file cũ
            await deleteFile(existingFile._id);
        }
        
        // Upload file mới
        const result = await uploadFile(fileBuffer, filename, {
            uploadedBy: req.headers['x-user-email'] || 'System',
            updatedAt: new Date()
        });
        
        console.log(`✅ File saved: ${filename} (${result.size} bytes)`);
        
        res.json({
            success: true,
            message: 'File đã được lưu thành công',
            filename: result.filename,
            fileId: result.fileId.toString()
        });
    } catch (error) {
        console.error('Error saving document:', error);
        res.status(500).json({ error: 'Không thể lưu file' });
    }
});

// API: Upload file mới
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file được upload' });
        }
        
        const result = await uploadFile(req.file.buffer, req.file.originalname, {
            uploadedBy: req.headers['x-user-email'] || 'Anonymous',
            originalName: req.file.originalname,
            mimeType: req.file.mimetype
        });
        
        console.log(`✅ File uploaded: ${result.filename} (${result.size} bytes)`);
        
        res.json({
            success: true,
            message: 'File đã được upload thành công',
            filename: result.filename,
            fileId: result.fileId.toString(),
            size: result.size
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Không thể upload file' });
    }
});

// API: Xóa file (by filename)
app.delete('/api/documents/:filename', async (req, res) => {
    try {
        const file = await findFileByName(req.params.filename);
        
        if (!file) {
            return res.status(404).json({ error: 'File không tồn tại' });
        }
        
        const success = await deleteFile(file._id);
        
        if (success) {
            console.log(`✅ File deleted: ${req.params.filename}`);
            res.json({
                success: true,
                message: 'File đã được xóa thành công'
            });
        } else {
            res.status(500).json({ error: 'Không thể xóa file' });
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Không thể xóa file' });
    }
});

// API: PUT endpoint để Word có thể save trực tiếp
app.put('/api/documents/:filename', async (req, res) => {
    try {
        console.log(`📝 Word đang lưu file: ${req.params.filename}`);
        
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            const buffer = Buffer.concat(chunks);
            
            // Kiểm tra file đã tồn tại chưa
            const existingFile = await findFileByName(req.params.filename);
            
            if (existingFile) {
                // Xóa file cũ
                await deleteFile(existingFile._id);
            }
            
            // Upload file mới
            const result = await uploadFile(buffer, req.params.filename, {
                uploadedBy: req.headers['x-user-email'] || 'Word',
                updatedAt: new Date()
            });
            
            console.log(`✅ File đã được lưu: ${req.params.filename} (${buffer.length} bytes)`);
            
            res.json({
                success: true,
                message: 'File đã được cập nhật thành công',
                filename: req.params.filename,
                fileId: result.fileId.toString(),
                size: buffer.length
            });
        });
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ error: 'Không thể cập nhật file' });
    }
});

// API: Mở file trong Word với auto-sync
app.post('/api/edit/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const file = await findFileByName(filename);
        
        if (!file) {
            return res.status(404).json({ error: 'File không tồn tại' });
        }
        
        console.log(`📝 Đang mở file để chỉnh sửa: ${filename}`);
        
        const { spawn } = require('child_process');
        const batPath = path.join(__dirname, '..', 'EDIT_FILE.bat');
        
        if (fsSync.existsSync(batPath)) {
            const child = spawn('cmd.exe', ['/c', 'start', 'cmd', '/k', batPath, filename], {
                detached: true,
                stdio: 'ignore',
                shell: true
            });
            child.unref();
        }
        
        res.json({
            success: true,
            message: `Word đang mở file ${filename}`,
            filename: filename,
            fileId: file._id.toString()
        });
    } catch (error) {
        console.error('Error opening file for edit:', error);
        res.status(500).json({ error: 'Không thể mở file: ' + error.message });
    }
});

// ==================== START SERVER ====================

// Kết nối MongoDB trước khi start server
connectDB()
    .then(() => {
        // Khởi động HTTPS server
        https.createServer(options, app).listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại https://localhost:${PORT}`);
            console.log(`💾 Database: MongoDB (GridFS)`);
            console.log(`📌 Mở Word và load Add-in để bắt đầu sử dụng`);
        });
    })
    .catch(error => {
        console.error('❌ Không thể khởi động server:', error);
        process.exit(1);
    });
