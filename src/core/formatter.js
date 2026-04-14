/**
 * Formatter
 * Converts data to requested format (JSON, CSV, JSONL, Tabular)
 */

const nodePath = require('path');
const nodeFs = require('fs');
const nodeProcess = require('process');
const { getOutputFolder } = require('../utils/env');

function formatDataset(dataset, format, options = {}) {
  const rows = dataset.rows || [];
  
  if (rows.length === 0) {
    return { content: '', filename: '', format };
  }
  
  let content;
  let filename;
  
  switch (format.toLowerCase()) {
    case 'json':
      content = formatJSON(rows, options.pretty || true);
      filename = `${sanitizeFilename(options.topic || 'dataset')}.json`;
      break;
    
    case 'csv':
      content = formatCSV(rows);
      filename = `${sanitizeFilename(options.topic || 'dataset')}.csv`;
      break;
    
    case 'jsonl':
      content = formatJSONL(rows);
      filename = `${sanitizeFilename(options.topic || 'dataset')}.jsonl`;
      break;
    
    case 'tabular':
      content = formatTabular(rows);
      filename = `${sanitizeFilename(options.topic || 'dataset')}.txt`;
      break;
    
    default:
      content = formatJSON(rows, true);
      filename = `${sanitizeFilename(options.topic || 'dataset')}.json`;
  }
  
  return { content, filename, format, rowCount: rows.length };
}

function formatJSON(rows, pretty = true) {
  if (pretty) {
    return JSON.stringify(rows, null, 2);
  }
  return JSON.stringify(rows);
}

function formatCSV(rows) {
  if (rows.length === 0) return '';
  
  const headers = Object.keys(rows[0]).filter(h => !h.startsWith('_'));
  const lines = [headers.join(',')];
  
  rows.forEach(row => {
    const values = headers.map(h => {
      const val = row[h];
      return csvEscape(val);
    });
    lines.push(values.join(','));
  });
  
  return lines.join('\n');
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

function formatJSONL(rows) {
  return rows.map(row => JSON.stringify(row)).join('\n');
}

function formatTabular(rows) {
  if (rows.length === 0) return '';
  
  const headers = Object.keys(rows[0]).filter(h => !h.startsWith('_'));
  
  const colWidths = headers.map(h => {
    const headerLen = h.length;
    const maxLen = Math.max(...rows.map(r => {
      const val = r[h];
      return val !== null && val !== undefined ? String(val).length : 4;
    }));
    return Math.max(headerLen, maxLen, 5);
  });
  
  const formatRow = (row) => {
    return headers.map((h, i) => {
      const val = row[h];
      const str = val !== null && val !== undefined ? String(val) : 'null';
      return str.padEnd(colWidths[i]);
    }).join(' | ');
  };
  
  const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');
  
  const lines = [
    formatRow(Object.fromEntries(headers.map(h => [h, h]))),
    separator,
    ...rows.map(row => formatRow(row))
  ];
  
  return lines.join('\n');
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
}

function saveToFile(content, filename, options = {}) {
  const cwd = nodeProcess.cwd();
  const outputFolder = getOutputFolder();
  const outputDir = nodePath.join(cwd, outputFolder);
  
  if (!nodeFs.existsSync(outputDir)) {
    nodeFs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filepath = nodePath.join(outputDir, filename);
  nodeFs.writeFileSync(filepath, content, 'utf8');
  
  return {
    filepath,
    filename,
    size: content.length,
    format: options.format || 'unknown'
  };
}

function getFileInfo(filepath) {
  try {
    const stats = nodeFs.statSync(filepath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch {
    return { exists: false };
  }
}

module.exports = { formatDataset, formatJSON, formatCSV, formatJSONL, formatTabular, saveToFile, getFileInfo };
