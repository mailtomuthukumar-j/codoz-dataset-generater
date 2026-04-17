/**
 * CODOZ Real Data Engine
 * Main orchestrator for fetching real-world datasets
 */

const domainDetector = require('./core/domain-detector');
const sourceFinder = require('./core/source-finder');
const fetcher = require('./core/fetcher');
const formatter = require('./core/formatter');
const uciSource = require('./sources/uci');
const kaggleSource = require('./sources/kaggle');
const huggingfaceSource = require('./sources/huggingface');
const dataGovSource = require('./sources/dataGov');
const logger = require('./utils/logger');
const { setLevel } = logger;

async function run(topic, options = {}) {
  const { size = 100, format = 'json', silent = false, debug = false } = options;
  
  if (silent) {
    setLevel('silent');
  } else if (debug) {
    setLevel('debug');
  }
  
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
      // Skip failed sources silently in silent mode
    }
  }
  
  // If no data from predefined sources, try dynamic search on HuggingFace
  if (allRows.length === 0) {
    try {
      const searchQueries = [
        topic,
        topic + ' dataset',
        topic + ' csv',
        topic + ' classification',
        topic + ' tabular'
      ];
      
      for (const query of searchQueries) {
        const searchResults = await huggingfaceSource.search(query);
        
        if (searchResults && searchResults.length > 0) {
          // Try to fetch from first matching dataset with downloads
          const sortedResults = searchResults
            .filter(d => d.downloads > 100)
            .sort((a, b) => b.downloads - a.downloads);
          
          for (const dataset of sortedResults.slice(0, 10)) {
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
          
          if (allRows.length > 0) break;
        }
      }
    } catch {
      // Search failed
    }
  }
  
  if (allRows.length === 0) {
    throw new Error('No data available for this topic');
  }
  
  const sampledRows = allRows.slice(0, size);
  
  const formatted = formatter.formatDataset({ rows: sampledRows }, format, {
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
    console.log(`  Rows: ${sampledRows.length}`);
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
    rowCount: sampledRows.length,
    format,
    qualityScore: 100,
    data: sampledRows,
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
