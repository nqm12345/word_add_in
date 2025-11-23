const fs = require('fs');
const config = require('../config');

/**
 * Load SSL certificates for HTTPS
 * @returns {Object} SSL options with key and cert
 * @throws {Error} If certificates not found
 */
function loadSSLCertificates() {
    const keyPath = config.CERT_PATH + '.key';
    const certPath = config.CERT_PATH + '.crt';

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        throw new Error(
            'SSL certificates not found. Please run mkcert to generate certificates:\n' +
            '  cd certs\n' +
            '  mkcert wordserver.local'
        );
    }

    return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
}

module.exports = { loadSSLCertificates };
