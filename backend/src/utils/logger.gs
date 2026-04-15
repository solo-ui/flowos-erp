// ══════════════════════════════════════════════════════════════════════════════
// LOGGING UTILITY MODULE
// Centralized logging with levels and formatting
// ══════════════════════════════════════════════════════════════════════════════

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR'
};

let logBuffer = [];

/**
 * Get current log level
 * @return {number} Log level
 */
function getCurrentLogLevel() {
  const levelName = getConfig('LOGGING.LEVEL', 'INFO');
  return LOG_LEVELS[levelName] || LOG_LEVELS.INFO;
}

/**
 * Format log message
 * @param {number} level - Log level
 * @param {string} message - Message
 * @param {object} data - Optional data
 * @return {string} Formatted message
 */
function formatLogMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const levelName = LEVEL_NAMES[level] || 'UNKNOWN';
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${levelName}] ${message}${dataStr}`;
}

/**
 * Log message at specified level
 * @param {number} level - Log level
 * @param {string} message - Message
 * @param {object} data - Optional data object
 */
function log(level, message, data) {
  if (level < getCurrentLogLevel()) {
    return;
  }

  const formatted = formatLogMessage(level, message, data);
  Logger.log(formatted);

  // Add to buffer
  logBuffer.push(formatted);
  if (logBuffer.length > getConfig('LOGGING.MAX_LOGS', 1000)) {
    logBuffer.shift();
  }
}

/**
 * Log debug message
 * @param {string} message - Message
 * @param {object} data - Optional data
 */
function logDebug(message, data) {
  log(LOG_LEVELS.DEBUG, message, data);
}

/**
 * Log info message
 * @param {string} message - Message
 * @param {object} data - Optional data
 */
function logInfo(message, data) {
  log(LOG_LEVELS.INFO, message, data);
}

/**
 * Log warning message
 * @param {string} message - Message
 * @param {object} data - Optional data
 */
function logWarn(message, data) {
  log(LOG_LEVELS.WARN, message, data);
}

/**
 * Log error message
 * @param {string} message - Message
 * @param {object} error - Error object or data
 */
function logError(message, error) {
  const data = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack
  } : error;
  log(LOG_LEVELS.ERROR, message, data);
}

/**
 * Get all logs
 * @return {array} Log entries
 */
function getLogs() {
  return [...logBuffer];
}

/**
 * Clear log buffer
 */
function clearLogs() {
  logBuffer = [];
  logInfo('Log buffer cleared');
}

/**
 * Export logs to a file
 * @return {string} Export summary
 */
function exportLogs() {
  try {
    const logContent = logBuffer.join('\n');
    const blob = Utilities.newBlob(logContent, 'text/plain', 'flowos-logs.txt');
    const folder = DriveApp.getFoldersByName('FlowOS_Documents').hasNext()
      ? DriveApp.getFoldersByName('FlowOS_Documents').next()
      : DriveApp.createFolder('FlowOS_Documents');
    const file = folder.createFile(blob);
    logInfo(`Logs exported to: ${file.getName()}`);
    return file.getUrl();
  } catch (error) {
    logError('Failed to export logs', error);
    throw error;
  }
}

/**
 * Get summary statistics
 * @return {object} Log statistics
 */
function getLogStats() {
  const stats = {
    total: logBuffer.length,
    byLevel: {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0
    }
  };

  logBuffer.forEach(entry => {
    if (entry.includes('[DEBUG]')) stats.byLevel.DEBUG++;
    else if (entry.includes('[INFO]')) stats.byLevel.INFO++;
    else if (entry.includes('[WARN]')) stats.byLevel.WARN++;
    else if (entry.includes('[ERROR]')) stats.byLevel.ERROR++;
  });

  return stats;
}
