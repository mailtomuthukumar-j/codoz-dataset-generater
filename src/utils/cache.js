/**
 * Simple Cache Utility
 * Caches API responses to reduce repeated calls
 */

const fs = require('fs');
const path = require('path');
const nodeCrypto = require('crypto');

const CACHE_DIR = path.join(process.cwd(), '.codoz_cache');
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCacheKey(topic, size) {
  const str = `${topic}_${size}`;
  return nodeCrypto.createHash('md5').update(str).digest('hex');
}

function getCachePath(key) {
  return path.join(CACHE_DIR, `${key}.json`);
}

function get(key) {
  try {
    ensureCacheDir();
    const filePath = getCachePath(key);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Check if expired
    if (Date.now() - data.timestamp > CACHE_TTL) {
      fs.unlinkSync(filePath);
      return null;
    }
    
    return data.rows;
  } catch {
    return null;
  }
}

function set(key, rows) {
  try {
    ensureCacheDir();
    const filePath = getCachePath(key);
    
    fs.writeFileSync(filePath, JSON.stringify({
      rows,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore cache write errors
  }
}

function clear() {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      });
    }
  } catch {
    // Ignore
  }
}

module.exports = { get, set, clear, getCacheKey };