/**
 * Simple logger utility
 */

const LOG_LEVELS = {
    ERROR: 'error',
    INFO: 'info',
    SUCCESS: 'success'
};

const ICONS = {
    error: '❌',
    info: '📡',
    success: '✅'
};

function log(level, message, ...args) {
    const icon = ICONS[level] || '📝';
    console.log(`${icon} ${message}`, ...args);
}

function error(message, ...args) {
    log(LOG_LEVELS.ERROR, message, ...args);
}

function info(message, ...args) {
    log(LOG_LEVELS.INFO, message, ...args);
}

function success(message, ...args) {
    log(LOG_LEVELS.SUCCESS, message, ...args);
}

module.exports = { error, info, success };
