/**
 * Logger Utility
 */

const LOG_LEVELS = {
  silent: -1,
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

let currentLevel = LOG_LEVELS.info;

function setLevel(level) {
  if (typeof level === 'string' && LOG_LEVELS[level] !== undefined) {
    currentLevel = LOG_LEVELS[level];
  } else if (typeof level === 'number') {
    currentLevel = level;
  }
}

function isSilent() {
  return currentLevel === LOG_LEVELS.silent;
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
  if (currentLevel >= LOG_LEVELS.error && !isSilent()) {
    console.error(formatMessage('error', message, data));
  }
}

function warn(message, data) {
  if (currentLevel >= LOG_LEVELS.warn && !isSilent()) {
    console.warn(formatMessage('warn', message, data));
  }
}

function info(message, data) {
  if (currentLevel >= LOG_LEVELS.info && !isSilent()) {
    console.log(formatMessage('info', message, data));
  }
}

function debug(message, data) {
  if (currentLevel >= LOG_LEVELS.debug && !isSilent()) {
    console.log(formatMessage('debug', message, data));
  }
}

module.exports = { error, warn, info, debug, setLevel, LOG_LEVELS, isSilent };
