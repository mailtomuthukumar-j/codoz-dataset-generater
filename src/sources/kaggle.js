/**
 * Kaggle Source Adapter
 * Fetches datasets from Kaggle
 */

const axios = require('axios');
const nodePath = require('path');
const nodeFs = require('fs');
const nodeOs = require('os');
const logger = require('../utils/logger');
const { isKaggleAvailable } = require('../utils/env');

function isAvailable() {
  return isKaggleAvailable();
}

function getCredentials() {
  const kagglePath = nodePath.join(nodeOs.homedir(), '.kaggle', 'kaggle.json');
  if (nodeFs.existsSync(kagglePath)) {
    try {
      const content = nodeFs.readFileSync(kagglePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  
  if (process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY) {
    return {
      username: process.env.KAGGLE_USERNAME,
      key: process.env.KAGGLE_KEY
    };
  }
  
  return null;
}

async function fetch(slug, options = {}) {
  const creds = getCredentials();
  
  if (!creds) {
    throw new Error('Kaggle credentials not found. Set KAGGLE_USERNAME and KAGGLE_KEY env vars or place kaggle.json in ~/.kaggle/');
  }
  
  try {
    const [owner, name] = slug.split('/');
    
    const metadataResponse = await axios.get(
      `https://www.kaggle.com/api/v1/datasets/view/${owner}/${name}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${creds.username}:${creds.key}`).toString('base64')}`
        },
        timeout: 30000
      }
    );
    
    let files = [];
    if (metadataResponse.data.files && metadataResponse.data.files.length > 0) {
      files = metadataResponse.data.files;
    } else if (metadataResponse.data.versions && metadataResponse.data.versions.length > 0) {
      const latestVersion = metadataResponse.data.versions[0];
      if (latestVersion.files) {
        files = latestVersion.files;
      }
    }
    
    let csvFile = files.length > 0 ? files.find(f => (f.name || f).endsWith('.csv')) || files[0] : null;
    
    if (!csvFile && files.length === 0) {
      const downloadUrl = `https://www.kaggle.com/api/v1/datasets/download/${owner}/${name}`;
      const downloadResponse = await axios.get(downloadUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${creds.username}:${creds.key}`).toString('base64')}`
        },
        responseType: 'arraybuffer',
        timeout: 120000
      });
      
      const csvContent = await parseDownload(downloadResponse.data, `${slug}.zip`);
      const rows = parseCSV(csvContent);
      
      logger.info(`Kaggle: Fetched ${rows.length} rows from ${slug}`);
      
      return {
        rows,
        source: 'kaggle',
        datasetName: slug,
        fileName: slug,
        rowCount: rows.length
      };
    }
    
    const csvFileName = typeof csvFile === 'string' ? csvFile : csvFile.name;
    
    const downloadUrl = `https://www.kaggle.com/api/v1/datasets/download/${owner}/${name}?file=${csvFileName}`;
    
    const downloadResponse = await axios.get(downloadUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${creds.username}:${creds.key}`).toString('base64')}`
      },
      responseType: 'arraybuffer',
      timeout: 120000
    });
    
    const csvContent = await parseDownload(downloadResponse.data, csvFileName);
    const rows = parseCSV(csvContent);
    
    logger.info(`Kaggle: Fetched ${rows.length} rows from ${slug}`);
    
    return {
      rows,
      source: 'kaggle',
      datasetName: slug,
      fileName: csvFileName,
      rowCount: rows.length
    };
  } catch (error) {
    logger.error(`Kaggle fetch error: ${error.message}`);
    throw error;
  }
}

async function parseDownload(buffer, filename) {
  const { execSync } = require('child_process');
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  
  const tempDir = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'kaggle-'));
  const zipPath = nodePath.join(tempDir, 'dataset.zip');
  
  fs.writeFileSync(zipPath, Buffer.from(buffer));
  
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`, { stdio: 'pipe' });
  } catch {
    try {
      execSync(`tar -xzf "${zipPath}" -C "${tempDir}"`, { stdio: 'pipe' });
    } catch {
      throw new Error('Failed to extract downloaded file');
    }
  }
  
  const csvPath = nodePath.join(tempDir, filename);
  
  if (!fs.existsSync(csvPath)) {
    const files = fs.readdirSync(tempDir);
    const actualCsv = files.find(f => f.endsWith('.csv'));
    if (actualCsv) {
      return fs.readFileSync(nodePath.join(tempDir, actualCsv), 'utf8');
    }
    throw new Error(`CSV file not found after extraction: ${filename}`);
  }
  
  return fs.readFileSync(csvPath, 'utf8');
}

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx]?.trim() || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

async function search(query) {
  if (!isAvailable()) {
    throw new Error('Kaggle credentials not found');
  }
  
  const creds = getCredentials();
  
  const response = await axios.get(
    `https://www.kaggle.com/api/v1/datasets/search?q=${encodeURIComponent(query)}&sortBy=relevance`,
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${creds.username}:${creds.key}`).toString('base64')}`
      },
      timeout: 30000
    }
  );
  
  return (response.data.datasets || []).map(d => ({
    ref: d.ref,
    title: d.title,
    size: d.size,
    downloadCount: d.downloadCount
  }));
}

module.exports = { fetch, search, isAvailable };
