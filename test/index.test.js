/**
 * CODOZ Unit Tests
 */

const assert = require('assert');

describe('Domain Detector', () => {
  const { detectDomain } = require('../src/core/domain-detector');
  
  it('should detect heart disease', () => {
    const result = detectDomain('heart_disease_prediction');
    assert.equal(result.domainFamily, 'medical');
    assert(result.mappings.kaggleSlugs?.length > 0 || result.mappings.huggingfaceIds?.length > 0);
  });
  
  it('should detect diabetes', () => {
    const result = detectDomain('diabetes_prediction');
    assert.equal(result.domainFamily, 'medical');
  });
  
  it('should detect stock market', () => {
    const result = detectDomain('stock_market_prediction');
    assert.equal(result.domainFamily, 'financial');
  });
  
  it('should detect sentiment analysis', () => {
    const result = detectDomain('sentiment_analysis_dataset');
    assert.equal(result.domainFamily, 'nlp_classification');
  });
});

describe('Cache', () => {
  const cache = require('../src/utils/cache');
  
  it('should store and retrieve data', () => {
    const testKey = 'test_key_123';
    const testData = [{ col1: 'val1', col2: 'val2' }];
    
    cache.set(testKey, testData);
    const retrieved = cache.get(testKey);
    
    assert.deepEqual(retrieved, testData);
  });
  
  it('should return null for non-existent key', () => {
    const result = cache.get('nonexistent_key_xyz');
    assert.equal(result, null);
  });
  
  it('should get cache stats', () => {
    const stats = cache.getStats();
    assert(typeof stats.files === 'number');
    assert(typeof stats.valid === 'number');
  });
});

describe('Formatter', () => {
  const formatter = require('../src/core/formatter');
  
  it('should format JSON data', () => {
    const testData = { rows: [{ a: 1, b: 2 }] };
    const result = formatter.formatDataset(testData, 'json', { topic: 'test' });
    assert(result.content.includes('a'));
  });
});

describe('Source Finder', () => {
  const { findBestSources } = require('../src/core/source-finder');
  const { detectDomain } = require('../src/core/domain-detector');
  
  it('should find sources for heart disease', () => {
    const topicInfo = detectDomain('heart_disease_prediction');
    const sources = findBestSources(topicInfo);
    assert(sources.recommended.length > 0);
  });
});

describe('Data Source Flow', () => {
  const { run } = require('../src/index');
  
  it('should return data for heart disease', async () => {
    const result = await run('heart_disease_prediction', { size: 5, noCache: true, silent: true });
    assert(result.success);
    assert(result.rowCount > 0);
    assert(result.dataSource);
  });
  
  it('should return data for diabetes', async () => {
    const result = await run('diabetes_prediction', { size: 5, noCache: true, silent: true });
    assert(result.success);
    assert(result.rowCount > 0);
  });
  
  it('should classify data source', async () => {
    const result = await run('heart_disease_prediction', { size: 5, noCache: true, silent: true });
    assert(['real', 'search', 'synthetic'].includes(result.dataSource));
  });
});

describe('Env Config', () => {
  const { checkApiKeys, isKaggleAvailable, isHuggingFaceAvailable } = require('../src/utils/env');
  
  it('should check API keys status', () => {
    const result = checkApiKeys();
    assert(typeof result.status === 'object');
    assert(typeof result.missing === 'object');
  });
});