const path = require('path');

module.exports = {
    // Server ports
    API_PORT: 3000,
    WEBDAV_PORT: 3001,

    // MongoDB
    MONGODB_DB_NAME: 'word_server_editor',
    
    // File upload
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_MIME_TYPES: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    
    // SSL Certificates
    CERT_PATH: path.join(__dirname, '..', 'certs', 'wordserver.local'),
    
    // CORS
    CORS_ORIGINS: '*',
    
    // WebDAV
    WEBDAV_URL: 'https://wordserver.local:3001',
    API_URL: 'https://wordserver.local:3000'
};
