/**
 * Source Finder
 * Selects the best sources for the given topic
 */

const { getAvailableSources } = require('./domain-detector');
const { isHuggingFaceAvailable } = require('../utils/env');

const SOURCE_PRIORITIES = {
  kaggle: 1,
  huggingface: 2,
  uci: 3,
  datagov: 4
};

function findBestSources(topicInfo) {
  const available = getAvailableSources();
  const { mappings, domain } = topicInfo;
  
  const candidateSources = [];
  
  if (mappings.kaggleSlugs && mappings.kaggleSlugs.length > 0 && available.kaggle) {
    mappings.kaggleSlugs.forEach(slug => {
      candidateSources.push({
        source: 'kaggle',
        slug,
        priority: SOURCE_PRIORITIES.kaggle,
        confidence: 0.95
      });
    });
  }
  
  if (mappings.uciIds && mappings.uciIds.length > 0 && available.uci) {
    mappings.uciIds.forEach(id => {
      candidateSources.push({
        source: 'uci',
        id,
        priority: SOURCE_PRIORITIES.uci,
        confidence: 0.85
      });
    });
  }
  
  if (mappings.huggingfaceIds && available.huggingface) {
    mappings.huggingfaceIds.forEach(id => {
      candidateSources.push({
        source: 'huggingface',
        id,
        priority: SOURCE_PRIORITIES.huggingface,
        confidence: 0.90
      });
    });
  }
  
  if (domain === 'government' && available.dataGov) {
    candidateSources.push({
      source: 'dataGov',
      domain,
      priority: SOURCE_PRIORITIES.dataGov,
      confidence: 0.80
    });
  }
  
  candidateSources.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.priority - b.priority;
  });
  
  return {
    recommended: candidateSources.slice(0, 3),
    all: candidateSources,
    availableSources: available
  };
}

function getSourceConfig(source, identifier) {
  const configs = {
    kaggle: {
      type: 'kaggle',
      identifier,
      requiresAuth: true,
      authMethod: '~/.kaggle/kaggle.json',
      downloadMethod: 'api'
    },
    uci: {
      type: 'uci',
      identifier,
      baseUrl: 'https://archive.ics.uci.edu/ml/machine-learning-databases',
      requiresAuth: false,
      downloadMethod: 'http'
    },
    huggingface: {
      type: 'huggingface',
      identifier,
      requiresAuth: isHuggingFaceAvailable(),
      authMethod: 'HUGGINGFACE_API_KEY',
      downloadMethod: 'api'
    },
    datagov: {
      type: 'datagov',
      domain: identifier,
      requiresAuth: false,
      authMethod: 'none',
      downloadMethod: 'api'
    }
  };
  
  return configs[source] || null;
}

module.exports = { findBestSources, getSourceConfig, SOURCE_PRIORITIES };
