/**
 * ============================================================================
 * WEBDAV SERVER - Cho phép Word Desktop đọc/ghi file trực tiếp từ server
 * ============================================================================
 * 
 * FLOW HOẠT ĐỘNG:
 * 1. User click "Chỉnh sửa" trên web → Browser mở URL: ms-word:ofe|u|https://server/file.docx
 * 2. Word Desktop nhận URL và gửi các WebDAV requests đến server này
 * 3. Server xử lý và trả về file / lưu file
 * 
 * CÁC METHOD WEBDAV:
 * - OPTIONS  : Word kiểm tra server có hỗ trợ WebDAV không
 * - PROPFIND : Word lấy thông tin file (size, ngày tạo...)
 * - GET      : Word tải file xuống để mở
 * - PUT      : Word lưu file lên server (khi user Ctrl+S)
 * - LOCK     : Word khóa file để tránh người khác edit cùng lúc
 * - UNLOCK   : Word mở khóa file khi đóng
 * - DELETE   : Xóa file
 * 
 * ============================================================================
 */

const https = require('https');
const url = require('url');

const config = require('./config');
const { loadSSLCertificates } = require('./utils/ssl');
const logger = require('./utils/logger');
const { connectDB, findFileByName, findFileById, uploadFile, downloadFile, deleteFile, listFiles, createNewVersion } = require('./database');

/**
 * Class xử lý WebDAV Server
 * Implement các method theo chuẩn WebDAV RFC 4918
 */
class SimpleWebDAVServer {
    constructor() {
        this.db = null;
    }

    /**
     * Khởi tạo kết nối database
     */
    async init() {
        this.db = await connectDB();
    }

    /**
     * Set các HTTP headers cần thiết cho WebDAV
     * - CORS headers: Cho phép cross-origin requests
     * - WebDAV headers: Báo cho Word biết server hỗ trợ WebDAV
     */
    setHeaders(res) {
        // CORS - Cho phép browser/Word gọi từ domain khác
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS, PROPFIND');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Depth, Authorization, If, Lock-Token, Timeout');
        res.setHeader('Access-Control-Expose-Headers', 'DAV, Content-Length, Allow');
        
        // WebDAV headers - Báo cho Word biết đây là WebDAV server
        res.setHeader('MS-Author-Via', 'DAV');           // Microsoft Office cần header này
        res.setHeader('DAV', '1, 2');                     // Hỗ trợ WebDAV level 1 và 2
        res.setHeader('Allow', 'OPTIONS, GET, PUT, DELETE, PROPFIND');  // Các method được phép
    }

    /**
     * ROUTER CHÍNH - Phân loại request và gọi handler tương ứng
     * 
     * URL FORMAT MỚI: /id/:fileId/:filename
     * Ví dụ: /id/507f1f77bcf86cd799439011/document.docx
     * 
     * Word sẽ gọi theo thứ tự:
     * 1. OPTIONS → Kiểm tra server
     * 2. PROPFIND → Lấy info file
     * 3. LOCK → Khóa file
     * 4. GET → Tải file xuống
     * 5. [User edit file]
     * 6. PUT → Lưu file (khi Ctrl+S)
     * 7. UNLOCK → Mở khóa
     */
    async handleRequest(req, res) {
        // Parse URL để lấy fileId và fileName
        // URL mới: /id/:fileId/:filename
        // URL cũ (fallback): /:filename
        const parsedUrl = url.parse(req.url, true);
        const pathname = decodeURIComponent(parsedUrl.pathname);
        
        let fileId = null;
        let fileName = null;
        
        // Check if URL matches new format: /id/:fileId/:filename
        const idMatch = pathname.match(/^\/id\/([a-f0-9]{24})\/(.+)$/i);
        if (idMatch) {
            fileId = idMatch[1];      // ObjectId string
            fileName = idMatch[2];     // filename.docx
            logger.info(`WebDAV request: ID=${fileId}, File=${fileName}`);
        } else {
            // Fallback: URL cũ chỉ có filename
            fileName = pathname.replace(/^\//, '');
            logger.info(`WebDAV request (legacy): File=${fileName}`);
        }

        // Set headers cho mọi response
        this.setHeaders(res);

        try {
            // Phân loại theo HTTP method
            switch (req.method) {
                case 'OPTIONS':
                    // Word gọi đầu tiên để kiểm tra server có hỗ trợ WebDAV không
                    await this.handleOptions(res);
                    break;
                case 'PROPFIND':
                    // Word lấy thông tin file (size, ngày tạo, content-type...)
                    await this.handlePropfind(res, fileId, fileName);
                    break;
                case 'GET':
                    // Word tải file xuống để mở và edit
                    await this.handleGet(res, fileId, fileName);
                    break;
                case 'PUT':
                    // Word lưu file lên server (khi user nhấn Ctrl+S)
                    // ĐÃ SỬA: Tạo version mới, không xóa file cũ
                    await this.handlePut(req, res, fileId, fileName);
                    break;
                case 'DELETE':
                    // Xóa file
                    await this.handleDelete(res, fileId, fileName);
                    break;
                case 'LOCK':
                    // Word khóa file để tránh conflict khi nhiều người edit
                    await this.handleLock(res, fileId, fileName);
                    break;
                case 'UNLOCK':
                    // Word mở khóa file khi đóng document
                    await this.handleUnlock(res);
                    break;
                default:
                    res.writeHead(405);
                    res.end('Method Not Allowed');
            }
        } catch (error) {
            logger.error(`WebDAV ${req.method} error:`, error.message);
            res.writeHead(500);
            res.end('Internal Server Error');
        }
    }

    /**
     * OPTIONS - Word kiểm tra server có hỗ trợ WebDAV không
     * Chỉ cần trả về 200 OK với headers đã set ở trên
     */
    async handleOptions(res) {
        res.writeHead(200);
        res.end();
    }

    /**
     * PROPFIND - Word lấy thông tin file (metadata)
     * 
     * Word cần biết: size, ngày sửa, content-type... trước khi tải file
     * Response trả về dạng XML theo chuẩn WebDAV
     * 
     * @param fileId - ID của file (nếu dùng URL mới)
     * @param fileName - Tên file cần lấy info. Nếu rỗng = lấy danh sách tất cả file
     */
    async handlePropfind(res, fileId, fileName) {
        if (!fileName && !fileId) {
            // Không có fileName → Trả về danh sách tất cả files
            const files = await listFiles();
            
            // Tạo XML response theo chuẩn WebDAV
            const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
${files.map(file => `  <D:response>
    <D:href>/${encodeURIComponent(file.filename)}</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>${file.filename}</D:displayname>
        <D:getcontentlength>${file.length}</D:getcontentlength>
        <D:getlastmodified>${file.uploadDate.toUTCString()}</D:getlastmodified>
        <D:resourcetype/>
        <D:getcontenttype>application/vnd.openxmlformats-officedocument.wordprocessingml.document</D:getcontenttype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`).join('\n')}
</D:multistatus>`;

            res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8' });
            res.end(xml);
        } else {
            // Có fileId hoặc fileName → Trả về info của file cụ thể
            let file = null;
            
            // Ưu tiên tìm theo ID nếu có
            if (fileId) {
                file = await findFileById(fileId);
            } else {
                file = await findFileByName(fileName);
            }
            
            if (!file) {
                res.writeHead(404);
                res.end();
                return;
            }

            // XML chứa: tên file, size, ngày sửa, content-type, version
            const version = file.metadata?.version || 1;
            const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/id/${file._id}/${encodeURIComponent(file.filename)}</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>${file.filename}</D:displayname>
        <D:getcontentlength>${file.length}</D:getcontentlength>
        <D:getlastmodified>${file.uploadDate.toUTCString()}</D:getlastmodified>
        <D:resourcetype/>
        <D:getcontenttype>application/vnd.openxmlformats-officedocument.wordprocessingml.document</D:getcontenttype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;

            res.writeHead(207, { 'Content-Type': 'application/xml; charset=utf-8' });
            res.end(xml);
        }
    }

    /**
     * ============================================================================
     * GET - WORD TẢI FILE XUỐNG ĐỂ MỞ
     * ============================================================================
     * 
     * Đây là bước Word tải nội dung file từ server về máy client
     * File được lưu tạm trong RAM/Temp của Windows, không save ra ổ cứng
     * 
     * Flow:
     * 1. Word gửi: GET /id/:fileId/:filename
     * 2. Server tìm file trong MongoDB theo ID
     * 3. Server trả về binary data của file
     * 4. Word nhận và mở file để edit
     * 
     * @param fileId - ID của file (ưu tiên)
     * @param fileName - Tên file (fallback nếu không có ID)
     */
    async handleGet(res, fileId, fileName) {
        // Validate: phải có ID hoặc tên file
        if (!fileId && !fileName) {
            res.writeHead(400);
            res.end('File ID or filename required');
            return;
        }

        // Bước 1: Tìm file trong MongoDB
        // Ưu tiên tìm theo ID (chính xác), fallback tìm theo tên
        let file = null;
        if (fileId) {
            file = await findFileById(fileId);
            logger.info(`GET: Finding file by ID: ${fileId}`);
        } else {
            file = await findFileByName(fileName);
            logger.info(`GET: Finding file by name: ${fileName}`);
        }
        
        // Không tìm thấy → 404
        if (!file) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        // Log version info
        const version = file.metadata?.version || 1;
        logger.info(`GET: Found ${file.filename} v${version}`);

        // Bước 2: Đọc nội dung file từ GridFS (binary data)
        const fileBuffer = await downloadFile(file._id);
        
        // Bước 3: Trả về cho Word
        res.writeHead(200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // MIME type cho .docx
            'Content-Length': fileBuffer.length,                    // Size của file
            'Content-Disposition': `inline; filename="${file.filename}"`, // Tên file
            'Accept-Ranges': 'bytes',                               // Hỗ trợ partial download
            'Cache-Control': 'no-cache',                            // Không cache, luôn lấy mới
            'X-File-Version': version.toString()                    // Custom header: version
        });
        
        // Gửi binary data về cho Word
        res.end(fileBuffer);
    }

    /**
     * ============================================================================
     * PUT - WORD LƯU FILE LÊN SERVER (KHI USER NHẤN CTRL+S)
     * ============================================================================
     * 
     * ĐÃ CẬP NHẬT: Không xóa file cũ, tạo VERSION MỚI
     * 
     * Flow:
     * 1. User edit file trong Word
     * 2. User nhấn Ctrl+S
     * 3. Word gửi: PUT /id/:fileId/:filename với body = nội dung file mới
     * 4. Server TÌM file theo ID (không theo tên)
     * 5. Server KHÔNG XÓA file cũ (giữ làm lịch sử)
     * 6. Server TẠO VERSION MỚI với nội dung mới
     * 7. Server trả về 204 No Content (thành công)
     * 8. Word hiện "Đã lưu" ✓
     * 
     * @param req - Request chứa binary data của file trong body
     * @param fileId - ID của file đang edit
     * @param fileName - Tên file (ví dụ: "document.docx")
     */
    async handlePut(req, res, fileId, fileName) {
        // Validate: phải có ID hoặc tên file
        if (!fileId && !fileName) {
            res.writeHead(400);
            res.end('File ID or filename required');
            return;
        }

        // Mảng chứa các chunk data từ request
        const chunks = [];
        
        // Nhận data từ Word (có thể đến theo nhiều chunks)
        req.on('data', chunk => chunks.push(chunk));

        // Khi nhận xong toàn bộ data
        req.on('end', async () => {
            try {
                // Ghép tất cả chunks thành 1 buffer hoàn chỉnh
                const buffer = Buffer.concat(chunks);
                
                // Bước 1: Tìm file đang được edit
                let originalFile = null;
                if (fileId) {
                    originalFile = await findFileById(fileId);
                    logger.info(`PUT: Finding file by ID: ${fileId}`);
                } else {
                    originalFile = await findFileByName(fileName);
                    logger.info(`PUT: Finding file by name: ${fileName}`);
                }

                if (originalFile) {
                    // Bước 2: TẠO VERSION MỚI (không xóa file cũ!)
                    const newVersion = await createNewVersion(buffer, originalFile._id, {
                        uploadedBy: 'Word Desktop',
                        source: 'WebDAV',
                        updatedAt: new Date()
                    });
                    
                    logger.success(`PUT: Created version ${newVersion.version} of ${newVersion.filename}`);
                } else {
                    // File chưa tồn tại → Upload file mới (version 1)
                    await uploadFile(buffer, fileName, {
                        uploadedBy: 'Word Desktop',
                        source: 'WebDAV',
                        updatedAt: new Date()
                    });
                    
                    logger.success(`PUT: Created new file ${fileName}`);
                }

                // Bước 3: Trả về 204 No Content = thành công
                res.writeHead(204);
                res.end();
            } catch (error) {
                logger.error(`WebDAV PUT error:`, error.message);
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        });
    }

    /**
     * DELETE - Xóa file khỏi server
     * (Thường không gọi từ Word, mà từ web UI)
     */
    async handleDelete(res, fileId, fileName) {
        if (!fileId && !fileName) {
            res.writeHead(400);
            res.end('File ID or filename required');
            return;
        }

        let file = null;
        if (fileId) {
            file = await findFileById(fileId);
        } else {
            file = await findFileByName(fileName);
        }
        
        if (!file) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        await deleteFile(file._id);
        res.writeHead(204);
        res.end();
    }

    /**
     * LOCK - Word khóa file trước khi edit
     * 
     * Mục đích: Tránh 2 người cùng edit 1 file (conflict)
     * Word gọi LOCK trước khi mở file, và UNLOCK khi đóng
     * 
     * Note: Đây là simple lock, chỉ trả về token giả
     * Nếu cần lock thật, phải lưu lock state vào database
     */
    async handleLock(res, fileId, fileName) {
        // Tạo lock token (unique ID)
        const lockToken = Date.now();
        
        // XML response theo chuẩn WebDAV
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:prop xmlns:D="DAV:">
  <D:lockdiscovery>
    <D:activelock>
      <D:locktype><D:write/></D:locktype>
      <D:lockscope><D:exclusive/></D:lockscope>
      <D:depth>0</D:depth>
      <D:timeout>Second-3600</D:timeout>
      <D:locktoken>
        <D:href>opaquelocktoken:${lockToken}</D:href>
      </D:locktoken>
    </D:activelock>
  </D:lockdiscovery>
</D:prop>`;

        res.writeHead(200, { 
            'Content-Type': 'application/xml; charset=utf-8',
            'Lock-Token': `<opaquelocktoken:${lockToken}>`  // Word cần token này để UNLOCK
        });
        res.end(xml);
    }

    /**
     * UNLOCK - Word mở khóa file khi đóng document
     * Chỉ cần trả về 204 OK
     */
    async handleUnlock(res) {
        res.writeHead(204);
        res.end();
    }
}

/**
 * ============================================================================
 * KHỞI ĐỘNG SERVER
 * ============================================================================
 */
async function startServer() {
    try {
        // Khởi tạo WebDAV server và kết nối database
        const server = new SimpleWebDAVServer();
        await server.init();

        // Load SSL certificates (HTTPS bắt buộc cho Word)
        const sslOptions = loadSSLCertificates();
        logger.success('SSL certificates loaded');

        // Tạo HTTPS server và gắn WebDAV handler
        const httpsServer = https.createServer(sslOptions, (req, res) => {
            server.handleRequest(req, res);
        });

        // Lắng nghe trên port đã config (mặc định 3001)
        httpsServer.listen(config.WEBDAV_PORT, () => {
            logger.success(`WebDAV Server running on https://wordserver.local:${config.WEBDAV_PORT}`);
            logger.info('Features: PROPFIND, GET, PUT, DELETE, LOCK/UNLOCK');
        });

        httpsServer.on('error', (error) => {
            logger.error('WebDAV server error:', error.message);
        });
    } catch (error) {
        logger.error('Failed to start WebDAV server:', error.message);
        process.exit(1);
    }
}

// Chạy server nếu file được chạy trực tiếp (node webdav-simple.js)
if (require.main === module) {
    startServer();
}

// Export để có thể import từ file khác
module.exports = { startServer };
