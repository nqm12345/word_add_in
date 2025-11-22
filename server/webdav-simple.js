const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { connectDB, findFileByName, uploadFile, downloadFile, deleteFile, listFiles } = require('./database');

// Simple WebDAV server (GET/PUT/OPTIONS only)
class SimpleWebDAVServer {
    constructor() {
        this.db = null;
    }

    async init() {
        console.log('🔧 Initializing Simple WebDAV Server...');
        this.db = await connectDB();
        console.log('✅ MongoDB connected');
    }

    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = decodeURIComponent(parsedUrl.pathname);
        const fileName = pathname.replace(/^\//, '');

        console.log(`📡 [${req.method}] ${pathname}`);

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS, PROPFIND');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Depth, Authorization, If, Lock-Token, Timeout');
        res.setHeader('Access-Control-Expose-Headers', 'DAV, Content-Length, Allow');

        // WebDAV headers
        res.setHeader('MS-Author-Via', 'DAV');
        res.setHeader('DAV', '1, 2');
        res.setHeader('Allow', 'OPTIONS, GET, PUT, DELETE, PROPFIND');

        try {
            switch (req.method) {
                case 'OPTIONS':
                    await this.handleOptions(req, res, fileName);
                    break;
                case 'PROPFIND':
                    await this.handlePropfind(req, res, fileName);
                    break;
                case 'GET':
                    await this.handleGet(req, res, fileName);
                    break;
                case 'PUT':
                    await this.handlePut(req, res, fileName);
                    break;
                case 'DELETE':
                    await this.handleDelete(req, res, fileName);
                    break;
                case 'LOCK':
                    await this.handleLock(req, res, fileName);
                    break;
                case 'UNLOCK':
                    await this.handleUnlock(req, res, fileName);
                    break;
                default:
                    res.writeHead(405, { 'Content-Type': 'text/plain' });
                    res.end('Method Not Allowed');
            }
        } catch (error) {
            console.error(`❌ Error handling ${req.method}:`, error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }

    async handleOptions(req, res, fileName) {
        res.writeHead(200);
        res.end();
    }

    async handlePropfind(req, res, fileName) {
        if (!fileName) {
            // Root - list all files
            const files = await listFiles();
            
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
            // Single file
            const file = await findFileByName(fileName);
            
            if (!file) {
                res.writeHead(404);
                res.end();
                return;
            }

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

    async handleGet(req, res, fileName) {
        if (!fileName) {
            res.writeHead(400);
            res.end('Filename required');
            return;
        }

        const file = await findFileByName(fileName);
        
        if (!file) {
            console.log(`❌ File not found: ${fileName}`);
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        const fileBuffer = await downloadFile(file._id);
        
        res.writeHead(200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Length': fileBuffer.length,
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache'
        });
        
        res.end(fileBuffer);
        console.log(`✅ [GET] ${fileName} (${fileBuffer.length} bytes)`);
    }

    async handlePut(req, res, fileName) {
        if (!fileName) {
            res.writeHead(400);
            res.end('Filename required');
            return;
        }

        const chunks = [];
        
        req.on('data', chunk => {
            chunks.push(chunk);
        });

        req.on('end', async () => {
            try {
                const buffer = Buffer.concat(chunks);
                
                // Delete old version
                const existingFile = await findFileByName(fileName);
                if (existingFile) {
                    await deleteFile(existingFile._id);
                    console.log(`🗑️ [PUT] Deleted old: ${fileName}`);
                }

                // Upload new version
                await uploadFile(buffer, fileName, {
                    uploadedBy: 'Word Desktop',
                    source: 'WebDAV',
                    updatedAt: new Date()
                });

                res.writeHead(204); // No Content
                res.end();
                console.log(`✅ [PUT] Saved: ${fileName} (${buffer.length} bytes)`);
            } catch (error) {
                console.error(`❌ [PUT] Error:`, error);
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        });
    }

    async handleDelete(req, res, fileName) {
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
        console.log(`✅ [DELETE] ${fileName}`);
    }

    async handleLock(req, res, fileName) {
        // Simple implementation - always allow lock
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:prop xmlns:D="DAV:">
  <D:lockdiscovery>
    <D:activelock>
      <D:locktype><D:write/></D:locktype>
      <D:lockscope><D:exclusive/></D:lockscope>
      <D:depth>0</D:depth>
      <D:timeout>Second-3600</D:timeout>
      <D:locktoken>
        <D:href>opaquelocktoken:${Date.now()}</D:href>
      </D:locktoken>
    </D:activelock>
  </D:lockdiscovery>
</D:prop>`;

        res.writeHead(200, { 
            'Content-Type': 'application/xml; charset=utf-8',
            'Lock-Token': `<opaquelocktoken:${Date.now()}>`
        });
        res.end(xml);
        console.log(`🔒 [LOCK] ${fileName}`);
    }

    async handleUnlock(req, res, fileName) {
        // Simple implementation - always allow unlock
        res.writeHead(204);
        res.end();
        console.log(`🔓 [UNLOCK] ${fileName}`);
    }
}

// Start server
async function startServer() {
    const server = new SimpleWebDAVServer();
    await server.init();

    // Load SSL certificates
    const certPath = path.join(__dirname, '../certs/wordserver.local.crt');
    const keyPath = path.join(__dirname, '../certs/wordserver.local.key');

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        console.error('❌ mkcert certificates not found!');
        process.exit(1);
    }

    const sslOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
    };

    const httpsServer = https.createServer(sslOptions, (req, res) => {
        server.handleRequest(req, res);
    });

    httpsServer.listen(3001, () => {
        console.log('');
        console.log('============================================');
        console.log('✅ Simple WebDAV Server Ready!');
        console.log('============================================');
        console.log('🔗 URL: https://wordserver.local:3001/');
        console.log('💾 Storage: MongoDB GridFS');
        console.log('🔒 HTTPS: mkcert (trusted)');
        console.log('');
        console.log('📖 Supported Methods:');
        console.log('   ✅ OPTIONS - Discovery');
        console.log('   ✅ PROPFIND - List/Info');
        console.log('   ✅ GET - Download');
        console.log('   ✅ PUT - Upload/Update');
        console.log('   ✅ DELETE - Remove');
        console.log('   ✅ LOCK/UNLOCK - Locking');
        console.log('');
        console.log('🎯 Usage:');
        console.log('   ms-word:ofe|u|https://wordserver.local:3001/filename.docx');
        console.log('============================================');
    });

    httpsServer.on('error', (error) => {
        console.error('❌ Server error:', error);
    });
}

if (require.main === module) {
    startServer().catch(error => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = { startServer };
