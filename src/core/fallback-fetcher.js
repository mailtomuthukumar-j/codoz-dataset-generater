/**
 * Fallback Fetcher
 * Handles cases when no dataset is found from primary sources
 */

const logger = require('../utils/logger');

const KNOWN_PUBLIC_DATASETS = {
  heart_disease: [
    { source: 'uci', id: 'heart-disease', url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/cleveland.data' },
    { source: 'kaggle', slug: 'andrewmvd/heart-failure-clinical-data' }
  ],
  diabetes: [
    { source: 'uci', id: 'pima-indians-diabetes', url: 'https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv' },
    { source: 'kaggle', slug: 'uciml/pima-indians-diabetes-database' }
  ],
  breast_cancer: [
    { source: 'uci', id: 'breast-cancer-wisconsin', url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/breast-cancer-wisconsin/wdbc.data' },
    { source: 'kaggle', slug: 'uciml/breast-cancer-wisconsin-data' }
  ],
  customer_churn: [
    { source: 'kaggle', slug: 'blastchar/telco-customer-churn' }
  ],
  credit_card_fraud: [
    { source: 'kaggle', slug: 'mlg-ulb/creditcardfraud' }
  ],
  loan_default: [
    { source: 'kaggle', slug: 'laotse/credit-risk-dataset' }
  ],
  employee_attrition: [
    { source: 'kaggle', slug: 'pavansubhasht/ibm-hr-analytics-attrition-dataset' }
  ],
  student_performance: [
    { source: 'kaggle', slug: 'stripathy/main-student-performance' },
    { source: 'uci', id: 'student-performance' }
  ],
  iris: [
    { source: 'uci', id: 'iris', url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/iris/iris.data' },
    { source: 'huggingface', id: 'iris' }
  ],
  wine: [
    { source: 'uci', id: 'wine', url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/wine/wine.data' }
  ]
};

async function fetchWithFallback(topic, topicInfo, options = {}) {
  logger.info(`Attempting fallback fetch for: ${topic}`);
  
  const topicKey = topicInfo.topicKey;
  
  if (topicKey && KNOWN_PUBLIC_DATASETS[topicKey]) {
    const fallbacks = KNOWN_PUBLIC_DATASETS[topicKey];
    
    for (const fallback of fallbacks) {
      try {
        const result = await tryFallbackSource(fallback, options);
        if (result && result.rows && result.rows.length > 0) {
          return {
            ...result,
            method: 'fallback',
            fallbackSource: fallback.source
          };
        }
      } catch (error) {
        logger.warn(`Fallback ${fallback.source} failed: ${error.message}`);
      }
    }
  }
  
  return generatePartialDataset(topic, topicInfo, options);
}

async function tryFallbackSource(source, options = {}) {
  if (source.source === 'huggingface') {
    const hf = require('../sources/huggingface');
    return await hf.fetch(source.id || source.slug, options);
  }
  
  if (source.source === 'kaggle') {
    const kaggle = require('../sources/kaggle');
    return await kaggle.fetch(source.slug, options);
  }
  
  if (source.url) {
    const axios = require('axios');
    try {
      const response = await axios.get(source.url, { timeout: 30000 });
      const lines = response.data.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',');
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((h, i) => {
          row[h.trim()] = values[i]?.trim() || null;
        });
        return row;
      });
      return { rows, source: source.source };
    } catch (error) {
      throw new Error(`Failed to fetch from URL: ${error.message}`);
    }
  }
  
  return null;
}

function generatePartialDataset(topic, topicInfo, options = {}) {
  logger.warn(`No real data found. Generating partial reference dataset for: ${topic}`);
  
  const partialData = {
    notice: 'REAL DATA NOT AVAILABLE',
    message: `Could not fetch real data for "${topic}" from any known source.`,
    alternatives: [
      'Please ensure you have Kaggle API credentials configured (~/.kaggle/kaggle.json)',
      'Set HUGGINGFACE_API_KEY environment variable for HuggingFace access',
      'Check your internet connection',
      'Try a different topic or dataset name'
    ],
    topic: topic,
    domain: topicInfo.domain,
    suggestedTopics: Object.keys(KNOWN_PUBLIC_DATASETS)
  };
  
  return {
    rows: [],
    schema: { columns: [], rowCount: 0 },
    partial: true,
    notice: partialData,
    method: 'partial_notice'
  };
}

function listAvailableTopics() {
  return Object.entries(KNOWN_PUBLIC_DATASETS).map(([key, sources]) => ({
    topic: key,
    sources: sources.map(s => s.source),
    hasKaggle: sources.some(s => s.source === 'kaggle'),
    hasUCI: sources.some(s => s.source === 'uci'),
    hasHuggingFace: sources.some(s => s.source === 'huggingface')
  }));
}

module.exports = { fetchWithFallback, tryFallbackSource, generatePartialDataset, listAvailableTopics, KNOWN_PUBLIC_DATASETS };
