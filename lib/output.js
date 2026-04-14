const fs = require('fs');
const path = require('path');

function save(dataset, metadata, format) {
  const outputDir = path.join(process.cwd(), 'dataset');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const baseName = metadata.name.replace(/\.[^.]+$/, '');
  let dataPath, metaPath;
  
  switch (format) {
    case 'csv':
      dataPath = path.join(outputDir, `${baseName}.csv`);
      metaPath = path.join(outputDir, `${baseName}_metadata.json`);
      saveCSV(dataset, dataPath);
      break;
    
    case 'jsonl':
      dataPath = path.join(outputDir, `${baseName}.jsonl`);
      metaPath = path.join(outputDir, `${baseName}_metadata.jsonl`);
      saveJSONL(dataset, dataPath);
      break;
    
    default:
      dataPath = path.join(outputDir, `${baseName}.json`);
      metaPath = path.join(outputDir, `${baseName}_metadata.json`);
      saveJSON(dataset, dataPath);
  }
  
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  
  console.log(`\nDataset saved to: ${dataPath}`);
  console.log(`Metadata saved to: ${metaPath}`);
  console.log(`Total rows: ${dataset.length}`);
  console.log(`Format: ${format}`);
}

function saveJSON(dataset, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));
}

function saveCSV(dataset, filePath) {
  if (dataset.length === 0) return;
  
  const headers = Object.keys(dataset[0]);
  const lines = [headers.join(',')];
  
  for (const row of dataset) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    lines.push(values.join(','));
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
}

function saveJSONL(dataset, filePath) {
  const lines = dataset.map(row => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, lines);
}

module.exports = { save };
