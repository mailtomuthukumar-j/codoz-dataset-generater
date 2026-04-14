/**
 * UCI ML Repository Source Adapter
 * Fetches datasets from UCI ML Repository
 */

const axios = require('axios');
const logger = require('../utils/logger');

const UCI_BASE_URL = 'https://archive.ics.uci.edu/ml/machine-learning-databases';

const KNOWN_DATASETS = {
  'heart-disease': {
    files: ['cleveland.data', 'hungarian.data', 'switzerland.data', 'va.data'],
    hasHeaders: false,
    columnNames: ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'num'],
    separator: ' ',
    minColumns: 13
  },
  'pima-indians-diabetes': {
    url: 'https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv',
    hasHeaders: false
  },
  'breast-cancer-wisconsin': {
    files: ['wdbc.data', 'wpbc.data'],
    hasHeaders: false
  },
  'iris': {
    url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/iris/iris.data',
    hasHeaders: false,
    columnNames: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species']
  },
  'wine': {
    url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/wine/wine.data',
    hasHeaders: false,
    columnNames: ['class', 'alcohol', 'malic_acid', 'ash', 'alcalinity_ash', 'magnesium', 'phenols_total', 'flavanoids', 'nonflavanoid_phenols', 'proanthocyanins', 'color_intensity', 'hue', 'od280_od315', 'proline']
  },
  'student-performance': {
    files: ['student-mat.csv', 'student-por.csv'],
    hasHeaders: true
  }
};

function isAvailable() {
  return true;
}

async function fetch(datasetId, options = {}) {
  const dataset = KNOWN_DATASETS[datasetId];
  
  if (!dataset) {
    throw new Error(`Unknown UCI dataset: ${datasetId}`);
  }
  
  try {
    if (dataset.url) {
      const fetchOptions = {
        hasHeaders: dataset.hasHeaders || false,
        columnNames: dataset.columnNames || null
      };
      const rows = await fetchFromURL(dataset.url, datasetId, fetchOptions);
      return {
        rows,
        source: 'uci',
        datasetId,
        rowCount: rows.length
      };
    }
    
    if (dataset.files && dataset.files.length > 0) {
      const allRows = [];
      const fetchOptions = {
        hasHeaders: dataset.hasHeaders || false,
        columnNames: dataset.columnNames || null
      };
      
      for (const file of dataset.files) {
        try {
          const url = `${UCI_BASE_URL}/${datasetId}/${file}`;
          const rows = await fetchFromURL(url, file, fetchOptions);
          allRows.push(...rows);
        } catch (error) {
          logger.warn(`Failed to fetch ${file}: ${error.message}`);
        }
      }
      
      if (allRows.length === 0) {
        throw new Error('No files could be fetched');
      }
      
      return {
        rows: allRows,
        source: 'uci',
        datasetId,
        rowCount: allRows.length
      };
    }
    
    throw new Error('Invalid dataset configuration');
  } catch (error) {
    logger.error(`UCI fetch error: ${error.message}`);
    throw error;
  }
}

async function fetchFromURL(url, name, options = {}) {
  const { hasHeaders = false, columnNames = null, separator = ',', minColumns = 1 } = options;
  
  const response = await axios.get(url, { timeout: 60000 });
  const content = response.data;
  
  const lines = content.split('\n').filter(l => l.trim());
  
  if (lines.length === 0) return [];
  
  const sepRegex = separator === ' ' ? /[\s,]+/ : new RegExp(separator);
  
  let rows = [];
  
  if (columnNames) {
    const headers = columnNames;
    const requiredCols = minColumns || headers.length;
    
    rows = lines.map(line => {
      const values = line.split(sepRegex).map(v => v.trim()).filter(v => v);
      if (values.length < requiredCols) return null;
      
      const row = {};
      
      for (let idx = 0; idx < Math.min(values.length, headers.length); idx++) {
        const val = values[idx];
        if (val && val !== '-9' && val !== '?') {
          const num = parseFloat(val);
          row[headers[idx]] = isNaN(num) ? val : num;
        }
      }
      
      return row;
    }).filter(r => r && Object.keys(r).length >= requiredCols);
  } else {
    const firstLineValues = lines[0].split(sepRegex).filter(v => v);
    const headers = hasHeaders 
      ? firstLineValues.map(h => h.trim())
      : generateHeaders(lines[0]);
    
    const dataLines = hasHeaders ? lines.slice(1) : lines;
    
    rows = dataLines.map(line => {
      const values = line.split(sepRegex).map(v => v.trim()).filter(v => v);
      if (values.length < minColumns) return null;
      
      const row = {};
      headers.forEach((h, idx) => {
        if (idx < values.length) {
          const val = values[idx];
          if (val && val !== '?' && val !== '-9') {
            const num = parseFloat(val);
            row[h] = isNaN(num) ? val : num;
          }
        }
      });
      return row;
    }).filter(r => r && Object.keys(r).length >= minColumns);
  }
  
  logger.info(`UCI: Fetched ${rows.length} rows from ${name}`);
  
  return rows;
}

function generateHeaders(line) {
  const count = line.split(',').length;
  return Array.from({ length: count }, (_, i) => `col_${i + 1}`);
}

async function listDatasets() {
  try {
    const response = await axios.get('https://archive.ics.uci.edu/ml/datasets.php', {
      timeout: 30000
    });
    
    const matches = response.data.match(/<a href="\/ml\/machine-learning-databases\/([^"]+)">/g);
    
    if (matches) {
      return matches.map(m => {
        const id = m.match(/machine-learning-databases\/([^"]+)/)[1];
        return id.replace(/\/$/, '');
      });
    }
    
    return Object.keys(KNOWN_DATASETS);
  } catch {
    return Object.keys(KNOWN_DATASETS);
  }
}

module.exports = { fetch, listDatasets, isAvailable, KNOWN_DATASETS };
