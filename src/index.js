/**
 * CODOZ Real Data Engine
 * Main orchestrator for fetching real-world datasets
 */

const domainDetector = require('./core/domain-detector');
const sourceFinder = require('./core/source-finder');
const fetcher = require('./core/fetcher');
const normalizer = require('./core/normalizer');
const merger = require('./core/merger');
const validator = require('./core/validator');
const formatter = require('./core/formatter');
const fallbackFetcher = require('./core/fallback-fetcher');
const logger = require('./utils/logger');
const { setLevel } = logger;

async function run(topic, options = {}) {
  const { size = 100, format = 'json', silent = false, debug = false } = options;
  
  if (debug) {
    setLevel('debug');
  }
  
  if (!silent) {
    console.log('\n' + '═'.repeat(60));
    console.log('  CODOZ · REAL DATA ENGINE');
    console.log('═'.repeat(60) + '\n');
    console.log(`Topic: ${topic}`);
    console.log(`Size: ${size} rows`);
    console.log(`Format: ${format}\n`);
  }
  
  logger.info(`Starting fetch for: ${topic}`);
  
  const topicInfo = domainDetector.detectDomain(topic);
  logger.info(`Detected domain: ${topicInfo.domain}, topicKey: ${topicInfo.topicKey || 'none'}`);
  
  const sourceInfo = sourceFinder.findBestSources(topicInfo);
  logger.info(`Available sources: ${JSON.stringify(sourceInfo.availableSources)}`);
  logger.info(`Recommended sources: ${sourceInfo.recommended.length}`);
  
  let normalizedDatasets = [];
  let fetchMethod = 'primary';
  
  for (const source of sourceInfo.recommended) {
    try {
      const config = sourceFinder.getSourceConfig(source.source, source.slug || source.id || source.domain);
      const rawData = await fetcher.fetchDataset(config, { rows: size });
      
      if (rawData && rawData.rows && rawData.rows.length > 0) {
        const normalized = normalizer.normalizeDataset(rawData.rows, {
          source: source.source,
          identifier: source.slug || source.id || source.domain
        });
        
        if (normalized) {
          normalizedDatasets.push(normalized);
          logger.info(`Fetched ${rawData.rows.length} rows from ${source.source}`);
        }
      }
    } catch (error) {
      logger.warn(`Failed to fetch from ${source.source}: ${error.message}`);
    }
  }
  
  if (normalizedDatasets.length === 0) {
    logger.warn('No data from primary sources, trying fallback...');
    
    const fallbackResult = await fallbackFetcher.fetchWithFallback(topic, topicInfo, { rows: size });
    
    if (fallbackResult.rows && fallbackResult.rows.length > 0) {
      const normalized = normalizer.normalizeDataset(fallbackResult.rows, {
        source: fallbackResult.fallbackSource || 'fallback',
        identifier: topic
      });
      
      if (normalized) {
        normalizedDatasets.push(normalized);
        fetchMethod = 'fallback';
      }
    } else if (fallbackResult.partial) {
      if (!silent) {
        console.log('\n⚠️  NOTICE: Real data not available\n');
        console.log(fallbackResult.notice.message);
        console.log('\nAlternatives:');
        fallbackResult.notice.alternatives.forEach((alt, i) => {
          console.log(`  ${i + 1}. ${alt}`);
        });
        console.log('\nSuggested topics:');
        console.log(fallbackResult.notice.suggestedTopics.join(', '));
        console.log('');
      }
      return { success: false, notice: fallbackResult.notice };
    }
  }
  
  if (normalizedDatasets.length === 0) {
    throw new Error('Could not fetch data from any source');
  }
  
  let mergedData = merger.mergeDatasets(normalizedDatasets);
  
  const validation = validator.validateDataset(mergedData, {
    nullThreshold: 0.8
  });
  
  logger.info(`Validation: ${validation.cleanedCount}/${validation.originalCount} rows valid`);
  
  mergedData.rows = validation.valid ? mergedData.rows : [];
  
  let finalData = merger.sampleFromMerged(mergedData, size);
  
  const formatted = formatter.formatDataset(finalData, format, {
    topic,
    pretty: true
  });
  
  const saved = formatter.saveToFile(formatted.content, formatted.filename, {
    format
  });
  
  if (!silent) {
    console.log('\n' + '═'.repeat(60));
    console.log('  FETCH COMPLETE');
    console.log('═'.repeat(60));
    console.log(`\n  Output: ${saved.filepath}`);
    console.log(`  Rows: ${formatted.rowCount}`);
    console.log(`  Format: ${format}`);
    console.log(`  Method: ${fetchMethod}`);
    console.log(`  Quality: ${validation.qualityScore}%`);
    console.log('');
  }
  
  return {
    success: true,
    output: saved,
    rowCount: formatted.rowCount,
    format,
    method: fetchMethod,
    qualityScore: validation.qualityScore,
    sources: normalizedDatasets.map(d => d.source)
  };
}

function getAvailableTopics() {
  return fallbackFetcher.listAvailableTopics();
}

function checkSources() {
  return domainDetector.getAvailableSources();
}

module.exports = { run, getAvailableTopics, checkSources };
