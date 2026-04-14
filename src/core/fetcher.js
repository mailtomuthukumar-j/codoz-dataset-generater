/**
 * Fetcher
 * Pulls real datasets via APIs and downloads
 */

const kaggleSource = require('../sources/kaggle');
const uciSource = require('../sources/uci');
const huggingfaceSource = require('../sources/huggingface');
const dataGovSource = require('../sources/dataGov');
const logger = require('../utils/logger');

async function fetchDataset(sourceConfig, options = {}) {
  const { type, identifier, domain } = sourceConfig;
  
  try {
    switch (type) {
      case 'kaggle':
        logger.info(`Fetching from Kaggle: ${identifier}`);
        return await kaggleSource.fetch(identifier, options);
      
      case 'uci':
        logger.info(`Fetching from UCI: ${identifier}`);
        return await uciSource.fetch(identifier, options);
      
      case 'huggingface':
        logger.info(`Fetching from HuggingFace: ${identifier}`);
        return await huggingfaceSource.fetch(identifier, options);
      
      case 'dataGov':
        logger.info(`Fetching from Data.gov: ${domain}`);
        return await dataGovSource.fetch(domain, options);
      
      default:
        logger.warn(`Unknown source type: ${type}`);
        return null;
    }
  } catch (error) {
    logger.error(`Failed to fetch from ${type}: ${error.message}`);
    return null;
  }
}

async function fetchFromMultipleSources(sources, options = {}) {
  const results = [];
  
  for (const source of sources) {
    try {
      const data = await fetchDataset(source, options);
      if (data && data.rows && data.rows.length > 0) {
        results.push({
          source: source.type,
          identifier: source.identifier || source.domain,
          data,
          success: true
        });
      }
    } catch (error) {
      results.push({
        source: source.type,
        identifier: source.identifier || source.domain,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}

async function fetchWithFallback(primarySources, fallbackSources, options = {}) {
  const primaryResults = await fetchFromMultipleSources(primarySources, options);
  
  const successfulPrimary = primaryResults.filter(r => r.success);
  if (successfulPrimary.length > 0) {
    return {
      sources: successfulPrimary,
      method: 'primary',
      totalRows: successfulPrimary.reduce((sum, r) => sum + r.data.rows.length, 0)
    };
  }
  
  logger.warn('Primary sources failed, trying fallback...');
  
  const fallbackResults = await fetchFromMultipleSources(fallbackSources, options);
  const successfulFallback = fallbackResults.filter(r => r.success);
  
  if (successfulFallback.length > 0) {
    return {
      sources: successfulFallback,
      method: 'fallback',
      totalRows: successfulFallback.reduce((sum, r) => sum + r.data.rows.length, 0)
    };
  }
  
  return {
    sources: [],
    method: 'none',
    totalRows: 0,
    errors: [...primaryResults, ...fallbackResults].filter(r => !r.success)
  };
}

module.exports = { fetchDataset, fetchFromMultipleSources, fetchWithFallback };
