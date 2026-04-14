/**
 * HuggingFace Source Adapter
 * Fetches datasets from HuggingFace
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { isHuggingFaceAvailable } = require('../utils/env');

function isAvailable() {
  return isHuggingFaceAvailable();
}

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (process.env.HUGGINGFACE_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.HUGGINGFACE_API_KEY}`;
  }
  
  return headers;
}

async function fetch(datasetId, options = {}) {
  const { rows: targetRows = 100 } = options;
  
  try {
    const [owner, name] = datasetId.includes('/') ? datasetId.split('/') : ['unknown', datasetId];
    
    const info = await getDatasetInfo(owner, name);
    
    if (!info) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }
    
    const rows = await downloadFromRaw(owner, name, targetRows);
    
    logger.info(`HuggingFace: Fetched ${rows.length} rows from ${datasetId}`);
    
    return {
      rows,
      source: 'huggingface',
      datasetId,
      datasetName: info.id,
      rowCount: rows.length
    };
  } catch (error) {
    logger.error(`HuggingFace fetch error: ${error.message}`);
    throw error;
  }
}

async function getDatasetInfo(owner, name) {
  try {
    const response = await axios.get(
      `https://huggingface.co/api/datasets/${owner}/${name}`,
      { headers: getHeaders(), timeout: 30000 }
    );
    return response.data;
  } catch {
    return null;
  }
}

async function downloadFromRaw(owner, name, maxRows) {
  const info = await getDatasetInfo(owner, name);
  
  if (!info || !info.siblings) {
    throw new Error(`Could not get dataset info for ${owner}/${name}`);
  }
  
  const csvFile = info.siblings.find(f => 
    f.rfilename.endsWith('.csv') && !f.rfilename.includes('README')
  );
  
  if (!csvFile) {
    throw new Error(`No CSV file found in dataset ${owner}/${name}`);
  }
  
  const fileUrl = `https://huggingface.co/datasets/${owner}/${name}/resolve/main/${csvFile.rfilename}`;
  
  const response = await axios.get(fileUrl, { timeout: 60000 });
  let rows = parseCSV(response.data);
  if (rows.length > maxRows) {
    rows = rows.slice(0, maxRows);
  }
  return rows;
}

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length * 0.5) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function search(query) {
  try {
    const response = await axios.get(
      `https://huggingface.co/api/datasets?search=${encodeURIComponent(query)}&limit=10`,
      { headers: getHeaders(), timeout: 30000 }
    );
    
    return response.data.map(d => ({
      id: d.id,
      title: d.id,
      downloads: d.downloads,
      tags: d.tags
    }));
  } catch (error) {
    logger.warn(`HuggingFace search failed: ${error.message}`);
    return [];
  }
}

module.exports = { fetch, search, isAvailable };
