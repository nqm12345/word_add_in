const https = require('https');
const url = require('url');

const config = require('./config');
const { loadSSLCertificates } = require('./utils/ssl');
const logger = require('./utils/logger');
const { connectDB, findFileByName, uploadFile, downloadFile, deleteFile, listFiles } = require('./database');

class SimpleWebDAVServer {
    constructor() {
        this.db = null;
    }

    async init() {
        this.db = await connectDB();
    }

    setHeaders(res) {
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS, PROPFIND');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Depth, Authorization, If, Lock-Token, Timeout');
        res.setHeader('Access-Control-Expose-Headers', 'DAV, Content-Length, Allow');
        
        // WebDAV
        res.setHeader('MS-Author-Via', 'DAV');
        res.setHeader('DAV', '1, 2');
        res.setHeader('Allow', 'OPTIONS, GET, PUT, DELETE, PROPFIND');
    }

    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = decodeURIComponent(parsedUrl.pathname);
        const fileName = pathname.replace(/^\//, '');

        this.setHeaders(res);

        try {
            switch (req.method) {
                case 'OPTIONS':
                    await this.handleOptions(res);
                    break;
                case 'PROPFIND':
                    await this.handlePropfind(res, fileName);
                    break;
                case 'GET':
                    await this.handleGet(res, fileName);
                    break;
                case 'PUT':
                    await this.handlePut(req, res, fileName);
                    break;
                case 'DELETE':
                    await this.handleDelete(res, fileName);
                    break;
                case 'LOCK':
                    await this.handleLock(res, fileName);
                    break;
                case 'UNLOCK':
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

    async handleOptions(res) {
        res.writeHead(200);
        res.end();
    }

    async handlePropfind(res, fileName) {
        if (!fileName) {
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

    async handleGet(res, fileName) {
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

        const fileBuffer = await downloadFile(file._id);
        
        res.writeHead(200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Length': fileBuffer.length,
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache'
        });
        
        res.end(fileBuffer);
    }

    async handlePut(req, res, fileName) {
        if (!fileName) {
            res.writeHead(400);
            res.end('Filename required');
            return;
        }

        const chunks = [];
        
        req.on('data', chunk => chunks.push(chunk));

        req.on('end', async () => {
            try {
                const buffer = Buffer.concat(chunks);
                
                const existingFile = await findFileByName(fileName);
                if (existingFile) {
                    await deleteFile(existingFile._id);
                }

                await uploadFile(buffer, fileName, {
                    uploadedBy: 'Word Desktop',
                    source: 'WebDAV',
                    updatedAt: new Date()
                });

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

    async handleLock(res, fileName) {
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
    }

    async handleUnlock(res) {
        res.writeHead(204);
        res.end();
    }
}

async function startServer() {
    try {
        const server = new SimpleWebDAVServer();
        await server.init();

        const sslOptions = loadSSLCertificates();
        logger.success('SSL certificates loaded');

        const httpsServer = https.createServer(sslOptions, (req, res) => {
            server.handleRequest(req, res);
        });

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

if (require.main === module) {
    startServer();
}

module.exports = { startServer };
