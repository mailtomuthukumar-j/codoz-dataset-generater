/**
 * Simple Cache Utility
 * Caches API responses to reduce repeated calls
 * Validates data freshness before returning cached data
 */

const fs = require('fs');
const path = require('path');
const nodeCrypto = require('crypto');

const CACHE_DIR = path.join(process.cwd(), '.codoz_cache');
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes - cache expires after this

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
    
    // Validate cached data structure
    if (!data.rows || !Array.isArray(data.rows) || data.rows.length === 0) {
      fs.unlinkSync(filePath);
      return null;
    }
    
    // Check that cached data has meaningful columns (not just empty objects)
    const firstRow = data.rows[0];
    if (typeof firstRow !== 'object' || Object.keys(firstRow).length < 2) {
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
      timestamp: Date.now(),
      dataSource: 'cached'
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

function getStats() {
  try {
    ensureCacheDir();
    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;
    let expired = 0;
    let valid = 0;
    
    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Date.now() - data.timestamp > CACHE_TTL) {
          expired++;
        } else {
          valid++;
        }
      } catch {
        expired++;
      }
    }
    
    return { files: files.length, valid, expired, totalSize };
  } catch {
    return { files: 0, valid: 0, expired: 0, totalSize: 0 };
  }
}

module.exports = { get, set, clear, getCacheKey, getStats };