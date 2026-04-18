/**
 * CODOZ Real Data Engine
 * Main orchestrator for fetching real-world datasets
 */

const domainDetector = require('./core/domain-detector');
const sourceFinder = require('./core/source-finder');
const fetcher = require('./core/fetcher');
const formatter = require('./core/formatter');
const schemaMapper = require('./core/schema-mapper');
const fallbackFetcher = require('./core/fallback-fetcher');
const uciSource = require('./sources/uci');
const kaggleSource = require('./sources/kaggle');
const huggingfaceSource = require('./sources/huggingface');
const dataGovSource = require('./sources/dataGov');
const logger = require('./utils/logger');
const { setLevel } = logger;
const cache = require('./utils/cache');

// Predefined topics - return real data with proper schema mapping
const PREDEFINED_TOPICS = [
  'iris', 'iris_flower',
  'wine', 'wine_quality',
  'heart_disease', 'heart_failure',
  'diabetes', 'pima',
  'breast_cancer',
  'student', 'student_performance',
  'house_price', 'house_price_prediction',
  'stock', 'stock_market', 'stock_market_data',
  'bank_loan', 'bank_loan_approval',
  'fraud', 'credit_card_fraud',
  'customer_churn',
  'sales', 'sales_forecasting',
  'weather', 'weather_prediction',
  'crypto', 'cryptocurrency', 'cryptocurrency_price',
  'air_quality', 'air_quality_index',
  'traffic', 'traffic_accident',
  'mobile', 'mobile_price',
  'fake_news', 'fake_news_detection',
  'loan_default', 'loan_default_risk',
  'ecommerce', 'ecommerce_customer_behavior'
];

function isPredefinedTopic(topic) {
  const normalized = topic.toLowerCase().replace(/[_-]/g, '');
  return PREDEFINED_TOPICS.some(t => 
    normalized.includes(t) || t.includes(normalized)
  );
}

async function run(topic, options = {}) {
  const { size = 100, format = 'json', silent = false, debug = false, noCache = false } = options;
  
  if (silent) {
    setLevel('silent');
  } else if (debug) {
    setLevel('debug');
  }
  
  // Check cache first
  const cacheKey = cache.getCacheKey(topic, size);
  if (!noCache) {
    const cachedRows = cache.get(cacheKey);
    if (cachedRows && cachedRows.length > 0) {
      const finalRows = cachedRows.slice(0, size);
      const formatted = formatter.formatDataset({ rows: finalRows }, format, {
        topic: topic.replace(/\s+/g, '_'),
        pretty: true
      });
      const saved = formatter.saveToFile(formatted.content, formatted.filename, { format });
      
      if (!silent) {
        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║              FETCH COMPLETE (Cached)                     ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        console.log(`\n  Output: ${saved.filepath}`);
        console.log(`  Rows: ${finalRows.length}`);
        console.log(`  Format: ${format}`);
        console.log('');
      }
      
      return {
        success: true,
        output: saved,
        rowCount: finalRows.length,
        format,
        qualityScore: 100,
        data: finalRows,
        sources: { cached: { count: finalRows.length } }
      };
    }
  }
  
  const isPredefined = isPredefinedTopic(topic);
  const topicInfo = domainDetector.detectDomain(topic);
  const sourceInfo = sourceFinder.findBestSources(topicInfo);
  
  let allRows = [];
  const sourcesUsed = {};
  let dataSource = 'none'; // 'real', 'search', 'synthetic'
  
  // ============================================================
  // STEP 1: Try to get REAL data from configured sources
  // ============================================================
  for (const src of sourceInfo.recommended) {
    try {
      let result = null;
      
      if (src.source === 'uci' && src.id) {
        result = await uciSource.fetch(src.id, options);
      } else if (src.source === 'kaggle' && src.slug) {
        result = await kaggleSource.fetch(src.slug, options);
      } else if (src.source === 'huggingface' && src.id) {
        result = await huggingfaceSource.fetch(src.id, options);
      } else if (src.source === 'dataGov' && src.domain) {
        result = await dataGovSource.fetch(src.domain, options);
      }
      
      if (result && result.rows && result.rows.length > 0) {
        allRows.push(...result.rows);
        sourcesUsed[result.source] = { count: result.rows.length };
        dataSource = 'real';
        break; // Found real data, stop here
      }
    } catch (error) {
      // Skip failed sources silently
    }
  }
  
  // ============================================================
  // STEP 2: If no real data, try dynamic search on HuggingFace
  // ============================================================
  if (allRows.length === 0) {
    try {
      // Get main topic keywords
      const mainKeywords = topic.toLowerCase()
        .replace(/prediction|analysis|forecast|detection|classification|risk|system|dataset/gi, '')
        .replace(/[^a-z0-9]/g, ' ')
        .trim()
        .split(' ')
        .filter(k => k.length > 2);
      
      if (mainKeywords.length > 0 && mainKeywords[0].length >= 3) {
        const searchTerm = mainKeywords.join(' ');
        const searchResults = await huggingfaceSource.search(searchTerm);
        
        // Filter results containing topic keywords
        const matchingResults = searchResults
          .filter(r => {
            const idLower = r.id.toLowerCase();
            return mainKeywords.some(kw => idLower.includes(kw));
          })
          .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        
        // Try fetching from matching results
        for (const dataset of matchingResults.slice(0, 5)) {
          try {
            const result = await huggingfaceSource.fetch(dataset.id, options);
            
            if (result && result.rows && result.rows.length > 0) {
              allRows.push(...result.rows);
              sourcesUsed['huggingface_search'] = { count: result.rows.length };
              dataSource = 'search';
              break;
            }
          } catch {
            // Try next dataset
          }
        }
      }
    } catch (error) {
      logger.error('Search error:', error.message);
    }
  }
  
  // ============================================================
  // STEP 3: If still no data, generate SYNTHETIC structured data
  // ============================================================
  if (allRows.length === 0) {
    try {
      logger.info('Generating synthetic data for:', topic);
      const fallbackResult = await fallbackFetcher.fetchWithFallback(topic, topicInfo, options);
      
      if (fallbackResult && fallbackResult.rows && fallbackResult.rows.length > 0) {
        allRows.push(...fallbackResult.rows);
        sourcesUsed['synthetic'] = { count: fallbackResult.rows.length };
        dataSource = 'synthetic';
      }
    } catch (error) {
      logger.error('Synthetic generation error:', error.message);
    }
  }
  
  // ============================================================
  // Final check - if still no data, throw error
  // ============================================================
  if (allRows.length === 0) {
    throw new Error(`No data available for "${topic}". Try: heart_disease, diabetes, breast_cancer, stock, fraud, churn`);
  }

  let finalRows = allRows.slice(0, size);
  
  // Apply schema mapping for predefined datasets
  if (isPredefined) {
    finalRows = schemaMapper.mapDataset(topic, finalRows);
  }

  // Cache the results
  if (allRows.length > 0 && !noCache) {
    cache.set(cacheKey, allRows);
  }

  const formatted = formatter.formatDataset({ rows: finalRows }, format, {
    topic: topic.replace(/\s+/g, '_'),
    pretty: true
  });
  
  const saved = formatter.saveToFile(formatted.content, formatted.filename, {
    format
  });

  if (!silent) {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║              FETCH COMPLETE                            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n  Output: ${saved.filepath}`);
    console.log(`  Rows: ${finalRows.length}`);
    console.log(`  Format: ${format}`);
    console.log(`\n  Data Source: ${dataSource}`);
    console.log('\n  Data Sources:');
    Object.entries(sourcesUsed).forEach(([name, info]) => {
      console.log(`    • ${name}: ${info.count} records`);
    });
    console.log('');
  }

  return {
    success: true,
    output: saved,
    rowCount: finalRows.length,
    format,
    qualityScore: dataSource === 'real' ? 100 : (dataSource === 'search' ? 85 : 70),
    dataSource,
    data: finalRows,
    sources: sourcesUsed
  };
}

function getAvailableTopics() {
  const fallbackFetcher = require('./core/fallback-fetcher');
  return fallbackFetcher.listAvailableTopics();
}

function checkSources() {
  return domainDetector.getAvailableSources();
}

module.exports = { run, getAvailableTopics, checkSources };