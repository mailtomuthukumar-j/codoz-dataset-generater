/**
 * Logger Utility
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

let currentLevel = LOG_LEVELS.info;

function setLevel(level) {
  if (typeof level === 'string' && LOG_LEVELS[level] !== undefined) {
    currentLevel = LOG_LEVELS[level];
  }
}

function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
}

function error(message, data) {
  if (currentLevel >= LOG_LEVELS.error) {
    console.error(formatMessage('error', message, data));
  }
}

function warn(message, data) {
  if (currentLevel >= LOG_LEVELS.warn) {
    console.warn(formatMessage('warn', message, data));
  }
}

function info(message, data) {
  if (currentLevel >= LOG_LEVELS.info) {
    console.log(formatMessage('info', message, data));
  }
}

function debug(message, data) {
  if (currentLevel >= LOG_LEVELS.debug) {
    console.log(formatMessage('debug', message, data));
  }
}

module.exports = { error, warn, info, debug, setLevel, LOG_LEVELS };
