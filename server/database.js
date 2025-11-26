const { MongoClient, GridFSBucket } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'word_server_editor';

let db = null;
let gridFSBucket = null;

/**
 * Kết nối MongoDB
 */
async function connectDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        db = client.db(DB_NAME);
        gridFSBucket = new GridFSBucket(db, {
            bucketName: 'documents'
        });
        
        console.log(`✅ MongoDB connected: ${DB_NAME}`);
        
        // Tạo indexes
        await createIndexes();
        
        return { db, gridFSBucket };
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

/**
 * Tạo indexes cho performance
 */
async function createIndexes() {
    try {
        // Index cho metadata collection
        await db.collection('documents.metadata').createIndex({ filename: 1 });
        await db.collection('documents.metadata').createIndex({ uploadDate: -1 });
        await db.collection('documents.metadata').createIndex({ 'metadata.uploadedBy': 1 });
        await db.collection('documents.metadata').createIndex({ 'metadata.tags': 1 });
        
        console.log('✅ Indexes created');
    } catch (error) {
        console.error('⚠️  Error creating indexes:', error);
    }
}

/**
 * Lấy database instance
 */
function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB() first.');
    }
    return db;
}

/**
 * Lấy GridFS bucket
 */
function getGridFS() {
    if (!gridFSBucket) {
        throw new Error('GridFS not initialized. Call connectDB() first.');
    }
    return gridFSBucket;
}

/**
 * Upload file vào GridFS
 */
async function uploadFile(fileBuffer, filename, metadata = {}) {
    return new Promise((resolve, reject) => {
        const uploadStream = gridFSBucket.openUploadStream(filename, {
            metadata: {
                ...metadata,
                uploadDate: new Date(),
                size: fileBuffer.length
            }
        });
        
        uploadStream.end(fileBuffer);
        
        uploadStream.on('finish', () => {
            resolve({
                fileId: uploadStream.id,
                filename: filename,
                size: fileBuffer.length
            });
        });
        
        uploadStream.on('error', reject);
    });
}

/**
 * Download file từ GridFS
 */
async function downloadFile(fileId) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const downloadStream = gridFSBucket.openDownloadStream(fileId);
        
        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
        downloadStream.on('error', reject);
    });
}

/**
 * Xóa file từ GridFS
 */
async function deleteFile(fileId) {
    try {
        await gridFSBucket.delete(fileId);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Lấy danh sách file
 */
async function listFiles(filter = {}, options = {}) {
    try {
        const files = await gridFSBucket.find(filter, options).toArray();
        return files;
    } catch (error) {
        console.error('Error listing files:', error);
        return [];
    }
}

/**
 * Tìm file theo filename
 */
async function findFileByName(filename) {
    try {
        const file = await gridFSBucket.find({ filename }).limit(1).next();
        return file;
    } catch (error) {
        console.error('Error finding file:', error);
        return null;
    }
}

/**
 * Cập nhật metadata của file
 */
async function updateFileMetadata(fileId, metadata) {
    try {
        await db.collection('documents.files').updateOne(
            { _id: fileId },
            { $set: { metadata } }
        );
        return true;
    } catch (error) {
        console.error('Error updating metadata:', error);
        return false;
    }
}

module.exports = {
    connectDB,
    getDB,
    getGridFS,
    uploadFile,
    downloadFile,
    deleteFile,
    listFiles,
    findFileByName,
    updateFileMetadata
};
