/**
 * CODOZ Real Data Engine
 * Main orchestrator for fetching real-world datasets
 */

const domainDetector = require('./core/domain-detector');
const sourceFinder = require('./core/source-finder');
const fetcher = require('./core/fetcher');
const formatter = require('./core/formatter');
const schemaMapper = require('./core/schema-mapper');
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
  
  // Try predefined sources first
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
      }
    } catch (error) {
      // Skip failed sources silently
    }
  }
  
// If no data from predefined sources, try dynamic search on HuggingFace
  if (allRows.length === 0) {
    try {
      logger.info(`Searching HuggingFace for: ${topic}`);
      
      // Try multiple search variations
      const searchTerms = [
        topic.trim(),
        topic.split(' ')[0], // first word only
        topic.replace(/prediction|analysis|forecast/gi, '').trim()
      ];
      
      for (const term of searchTerms) {
        if (!term || term.length < 2) continue;
        
        const searchResults = await huggingfaceSource.search(term);
        
        if (searchResults && searchResults.length > 0) {
          const sortedResults = searchResults
            .filter(d => d.downloads > 5)
            .sort((a, b) => b.downloads - a.downloads);
          
          for (const dataset of sortedResults.slice(0, 30)) {
            try {
              const result = await huggingfaceSource.fetch(dataset.id, options);
              
              if (result && result.rows && result.rows.length > 0) {
                allRows.push(...result.rows);
                sourcesUsed[result.source] = { count: result.rows.length };
                break;
              }
            } catch {
              // Try next dataset
            }
          }
        }
        
        if (allRows.length > 0) break;
      }
    } catch {
      // Search failed
    }
  }
  
  if (allRows.length === 0) {
    throw new Error('No data available for this topic');
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
    qualityScore: 100,
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