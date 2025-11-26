const express = require('express');
const https = require('https');
const cors = require('cors');
const multer = require('multer');

const config = require('./config');
const { loadSSLCertificates } = require('./utils/ssl');
const logger = require('./utils/logger');
const {
    connectDB,
    uploadFile,
    downloadFile,
    deleteFile,
    listFiles,
    findFileByName
} = require('./database');

const app = express();

// Middleware
app.use(cors({ origin: config.CORS_ORIGINS }));
app.use(express.json({ limit: '50mb' }));

// Multer config
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: config.MAX_FILE_SIZE }
});

// ==================== API ENDPOINTS ====================

// Get all documents
app.get('/api/documents', async (req, res) => {
    try {
        const files = await listFiles({}, { sort: { uploadDate: -1 } });
        
        const documents = files.map(file => ({
            _id: file._id.toString(),
            filename: file.filename,
            length: file.length,
            uploadDate: file.uploadDate,
            uploadedBy: file.metadata?.uploadedBy || 'Unknown',
            tags: file.metadata?.tags || [],
            path: `/api/documents/${file.filename}`
        }));
        
        res.json(documents);
    } catch (error) {
        logger.error('Error listing documents:', error.message);
        res.status(500).json({ error: 'Không thể tải danh sách file' });
    }
});

// Download document by filename
app.get('/api/documents/:filename', async (req, res) => {
    try {
        const file = await findFileByName(req.params.filename);
        
        if (!file) {
            return res.status(404).json({ error: 'File không tồn tại' });
        }
        
        const fileBuffer = await downloadFile(file._id);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
        res.setHeader('Cache-Control', 'no-cache');
        
        res.send(fileBuffer);
    } catch (error) {
        logger.error('Error downloading document:', error.message);
        res.status(500).json({ error: 'Không thể tải file' });
    }
});

// Upload new document
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
        
        logger.success(`File uploaded: ${result.filename}`);
        
        res.json({
            success: true,
            message: 'File đã được upload thành công',
            filename: result.filename,
            fileId: result.fileId.toString(),
            size: result.size
        });
    } catch (error) {
        logger.error('Error uploading document:', error.message);
        res.status(500).json({ error: 'Không thể upload file' });
    }
});

// Delete document
app.delete('/api/documents/:filename', async (req, res) => {
    try {
        const file = await findFileByName(req.params.filename);
        
        if (!file) {
            return res.status(404).json({ error: 'File không tồn tại' });
        }
        
        const success = await deleteFile(file._id);
        
        if (success) {
            logger.success(`File deleted: ${req.params.filename}`);
            res.json({
                success: true,
                message: 'File đã được xóa thành công'
            });
        } else {
            res.status(500).json({ error: 'Không thể xóa file' });
        }
    } catch (error) {
        logger.error('Error deleting document:', error.message);
        res.status(500).json({ error: 'Không thể xóa file' });
    }
});

// ==================== START SERVER ====================

async function startServer() {
    try {
        // Load SSL certificates
        const sslOptions = loadSSLCertificates();
        logger.success('SSL certificates loaded');
        
        // Connect to MongoDB
        await connectDB();
        
        // Start HTTPS server
        https.createServer(sslOptions, app).listen(config.API_PORT, () => {
            logger.success(`API Server running on https://localhost:${config.API_PORT}`);
            logger.info('Database: MongoDB (GridFS)');
        });
    } catch (error) {
        logger.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
