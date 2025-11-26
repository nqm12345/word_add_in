const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

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
 * Upload file vào GridFS (file mới - version 1)
 */
async function uploadFile(fileBuffer, filename, metadata = {}) {
    return new Promise((resolve, reject) => {
        const uploadStream = gridFSBucket.openUploadStream(filename, {
            metadata: {
                ...metadata,
                version: 1,              // Version đầu tiên
                isLatest: true,          // Đánh dấu là version mới nhất
                parentId: null,          // File gốc không có parent
                uploadDate: new Date(),
                size: fileBuffer.length
            }
        });
        
        uploadStream.end(fileBuffer);
        
        uploadStream.on('finish', () => {
            // Cập nhật parentId = chính nó (sau khi có _id)
            db.collection('documents.files').updateOne(
                { _id: uploadStream.id },
                { $set: { 'metadata.parentId': uploadStream.id } }
            );
            
            resolve({
                fileId: uploadStream.id,
                filename: filename,
                version: 1,
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
 * Tìm file theo ID (dùng cho WebDAV)
 * @param fileId - ObjectId hoặc string ID của file
 */
async function findFileById(fileId) {
    try {
        // Chuyển string thành ObjectId nếu cần
        const objectId = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
        const file = await gridFSBucket.find({ _id: objectId }).limit(1).next();
        return file;
    } catch (error) {
        console.error('Error finding file by ID:', error);
        return null;
    }
}

/**
 * Tạo version mới của file (không xóa file cũ)
 * @param fileBuffer - Nội dung file mới
 * @param originalFileId - ID của file đang được edit
 * @param metadata - Thông tin bổ sung
 * @returns File mới với version tăng
 */
async function createNewVersion(fileBuffer, originalFileId, metadata = {}) {
    try {
        // Tìm file gốc để lấy thông tin
        const originalFile = await findFileById(originalFileId);
        if (!originalFile) {
            throw new Error('Original file not found');
        }

        // Lấy version hiện tại và tăng lên
        const currentVersion = originalFile.metadata?.version || 1;
        const newVersion = currentVersion + 1;

        // Xác định parentId (file gốc đầu tiên)
        // Nếu file hiện tại đã có parentId → dùng parentId đó
        // Nếu không → file hiện tại là file gốc
        const parentId = originalFile.metadata?.parentId || originalFile._id;

        // Đánh dấu file cũ không còn là latest
        await db.collection('documents.files').updateOne(
            { _id: originalFile._id },
            { $set: { 'metadata.isLatest': false } }
        );

        // Upload file mới với version info
        return new Promise((resolve, reject) => {
            const uploadStream = gridFSBucket.openUploadStream(originalFile.filename, {
                metadata: {
                    ...metadata,
                    version: newVersion,
                    parentId: parentId,              // Link đến file gốc
                    previousVersionId: originalFile._id,  // Link đến version trước
                    isLatest: true,                  // Đánh dấu là version mới nhất
                    uploadDate: new Date(),
                    size: fileBuffer.length
                }
            });
            
            uploadStream.end(fileBuffer);
            
            uploadStream.on('finish', () => {
                console.log(`✅ Created version ${newVersion} of ${originalFile.filename}`);
                resolve({
                    fileId: uploadStream.id,
                    filename: originalFile.filename,
                    version: newVersion,
                    size: fileBuffer.length
                });
            });
            
            uploadStream.on('error', reject);
        });
    } catch (error) {
        console.error('Error creating new version:', error);
        throw error;
    }
}

/**
 * Lấy tất cả versions của một file
 * @param parentId - ID của file gốc
 */
async function getFileVersions(parentId) {
    try {
        const objectId = typeof parentId === 'string' ? new ObjectId(parentId) : parentId;
        
        // Tìm tất cả files có cùng parentId hoặc chính là file gốc
        const versions = await gridFSBucket.find({
            $or: [
                { _id: objectId },
                { 'metadata.parentId': objectId }
            ]
        }).sort({ 'metadata.version': -1 }).toArray();
        
        return versions;
    } catch (error) {
        console.error('Error getting file versions:', error);
        return [];
    }
}

/**
 * Lấy version mới nhất của file theo parentId
 */
async function getLatestVersion(parentId) {
    try {
        const objectId = typeof parentId === 'string' ? new ObjectId(parentId) : parentId;
        
        const latestFile = await gridFSBucket.find({
            $or: [
                { _id: objectId, 'metadata.isLatest': true },
                { 'metadata.parentId': objectId, 'metadata.isLatest': true }
            ]
        }).limit(1).next();
        
        return latestFile;
    } catch (error) {
        console.error('Error getting latest version:', error);
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
    findFileById,           // Tìm file theo ID
    createNewVersion,       // Tạo version mới (không xóa cũ)
    getFileVersions,        // Lấy tất cả versions
    getLatestVersion,       // Lấy version mới nhất
    updateFileMetadata
};
