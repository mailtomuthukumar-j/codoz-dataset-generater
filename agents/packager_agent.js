/**
 * CODOZ Packager Agent
 * 
 * Delivers the final dataset to the user.
 * Only generates the data file in the requested format.
 */

const fs = require('fs');
const path = require('path');
const nodePath = require('path');
const nodeProcess = require('process');

function process(context) {
  const { dataset, schema, topicAnalysis, qualityScore, format, topic } = context;
  
  const cwd = nodeProcess.cwd();
  const outputDir = nodePath.join(cwd, 'codoz dataset');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const safeTopicName = generateSafeFilename(topic || topicAnalysis?.topic || 'dataset');
  const outputFormat = format || 'json';
  const dataFilename = `${safeTopicName}.${outputFormat}`;
  const dataFilepath = nodePath.join(outputDir, dataFilename);
  
  writeDataFile(dataset, outputFormat, dataFilepath);
  
  return {
    ...context,
    outputFiles: {
      data: dataFilepath
    },
    logs: [...context.logs, {
      event: 'delivery_complete',
      data: { format: outputFormat, rows: dataset.length, filename: dataFilename }
    }]
  };
}

function generateSafeFilename(topic) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
}

function writeDataFile(dataset, format, filepath) {
  let content;
  
  switch (format) {
    case 'csv':
      content = generateCSV(dataset);
      break;
    
    case 'jsonl':
      content = dataset.map(row => JSON.stringify(row)).join('\n');
      break;
    
    case 'tabular':
      content = generateTabular(dataset);
      break;
    
    case 'json':
    default:
      content = JSON.stringify(dataset, null, 2);
      break;
  }
  
  fs.writeFileSync(filepath, content, 'utf8');
}

function generateCSV(dataset) {
  if (dataset.length === 0) return '';
  
  const headers = Object.keys(dataset[0]);
  const rows = dataset.map(row => 
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return String(val);
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

function generateTabular(dataset) {
  if (dataset.length === 0) return '';
  
  const headers = Object.keys(dataset[0]);
  const colWidths = headers.map(h => Math.max(h.length, ...dataset.map(r => String(r[h] || '').length)));
  
  const formatRow = (row) => headers.map((h, i) => {
    const val = String(row[h] ?? '');
    return val.padEnd(colWidths[i]);
  }).join(' | ');
  
  const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');
  
  return [
    formatRow(Object.fromEntries(headers.map(h => [h, h]))),
    separator,
    ...dataset.map(row => formatRow(row))
  ].join('\n');
}

module.exports = { process };
