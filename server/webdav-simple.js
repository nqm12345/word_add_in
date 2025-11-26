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
const { connectDB, findFileByName, uploadFile, downloadFile, deleteFile, listFiles } = require('./database');

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
        // Parse URL để lấy tên file
        // Ví dụ: /document.docx → fileName = "document.docx"
        const parsedUrl = url.parse(req.url, true);
        const pathname = decodeURIComponent(parsedUrl.pathname);
        const fileName = pathname.replace(/^\//, '');  // Bỏ dấu / đầu tiên

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
                    await this.handlePropfind(res, fileName);
                    break;
                case 'GET':
                    // Word tải file xuống để mở và edit
                    await this.handleGet(res, fileName);
                    break;
                case 'PUT':
                    // Word lưu file lên server (khi user nhấn Ctrl+S)
                    await this.handlePut(req, res, fileName);
                    break;
                case 'DELETE':
                    // Xóa file
                    await this.handleDelete(res, fileName);
                    break;
                case 'LOCK':
                    // Word khóa file để tránh conflict khi nhiều người edit
                    await this.handleLock(res, fileName);
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
     * @param fileName - Tên file cần lấy info. Nếu rỗng = lấy danh sách tất cả file
     */
    async handlePropfind(res, fileName) {
        if (!fileName) {
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
            // Có fileName → Trả về info của file cụ thể
            const file = await findFileByName(fileName);
            
            if (!file) {
                res.writeHead(404);
                res.end();
                return;
            }

            // XML chứa: tên file, size, ngày sửa, content-type
            const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/${encodeURIComponent(fileName)}</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>${fileName}</D:displayname>
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
     * 1. Word gửi: GET /document.docx
     * 2. Server tìm file trong MongoDB
     * 3. Server trả về binary data của file
     * 4. Word nhận và mở file để edit
     * 
     * @param fileName - Tên file cần tải (ví dụ: "document.docx")
     */
    async handleGet(res, fileName) {
        // Validate: phải có tên file
        if (!fileName) {
            res.writeHead(400);
            res.end('Filename required');
            return;
        }

        // Bước 1: Tìm file trong MongoDB theo tên
        const file = await findFileByName(fileName);
        
        // Không tìm thấy → 404
        if (!file) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        // Bước 2: Đọc nội dung file từ GridFS (binary data)
        const fileBuffer = await downloadFile(file._id);
        
        // Bước 3: Trả về cho Word
        res.writeHead(200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // MIME type cho .docx
            'Content-Length': fileBuffer.length,                    // Size của file
            'Content-Disposition': `inline; filename="${fileName}"`, // Tên file
            'Accept-Ranges': 'bytes',                               // Hỗ trợ partial download
            'Cache-Control': 'no-cache'                             // Không cache, luôn lấy mới
        });
        
        // Gửi binary data về cho Word
        res.end(fileBuffer);
    }

    /**
     * ============================================================================
     * PUT - WORD LƯU FILE LÊN SERVER (KHI USER NHẤN CTRL+S)
     * ============================================================================
     * 
     * Đây là bước quan trọng nhất - khi user nhấn Ctrl+S trong Word,
     * Word sẽ gửi toàn bộ nội dung file mới lên server qua PUT request
     * 
     * Flow:
     * 1. User edit file trong Word
     * 2. User nhấn Ctrl+S
     * 3. Word gửi: PUT /document.docx với body = nội dung file mới
     * 4. Server xóa file cũ trong MongoDB
     * 5. Server lưu file mới vào MongoDB
     * 6. Server trả về 204 No Content (thành công)
     * 7. Word hiện "Đã lưu" ✓
     * 
     * @param req - Request chứa binary data của file trong body
     * @param fileName - Tên file (ví dụ: "document.docx")
     */
    async handlePut(req, res, fileName) {
        // Validate: phải có tên file
        if (!fileName) {
            res.writeHead(400);
            res.end('Filename required');
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
                
                // Bước 1: Kiểm tra file cũ có tồn tại không
                const existingFile = await findFileByName(fileName);
                if (existingFile) {
                    // Xóa file cũ trước khi lưu file mới (update = delete + insert)
                    await deleteFile(existingFile._id);
                }

                // Bước 2: Lưu file mới vào MongoDB GridFS
                await uploadFile(buffer, fileName, {
                    uploadedBy: 'Word Desktop',    // Đánh dấu nguồn upload
                    source: 'WebDAV',              // Qua WebDAV protocol
                    updatedAt: new Date()          // Thời gian cập nhật
                });

                // Bước 3: Trả về 204 No Content = thành công, không có body
                res.writeHead(204);
                res.end();
                logger.success(`WebDAV PUT: ${fileName}`);
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
    async handleDelete(res, fileName) {
        if (!fileName) {
            res.writeHead(400);
            res.end('Filename required');
            return;
        }

        const file = await findFileByName(fileName);
        
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
    async handleLock(res, fileName) {
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
