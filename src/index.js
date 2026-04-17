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

// Predefined topics - return real data as-is
const PREDEFINED_TOPICS = [
  'iris', 'wine', 'heart_disease', 'diabetes', 'breast_cancer',
  'heart_failure', 'pima', 'student', 'customer_churn', 'fraud',
  'loan', 'attrition', 'titanic', 'mnist', 'cifar'
];

function isPredefinedTopic(topic) {
  const normalized = topic.toLowerCase().replace(/[_-]/g, '');
  return PREDEFINED_TOPICS.some(t => 
    normalized.includes(t) || t.includes(normalized)
  );
}

function structureForTraining(rows, topic) {
  return rows.map((row, index) => {
    const structured = {
      id: index + 1,
      topic: topic,
      features: {},
      label: null,
      metadata: {
        source: 'huggingface_api',
        timestamp: new Date().toISOString()
      }
    };

    const columns = Object.keys(row);
    const numColumns = columns.length;

    // Detect label column (usually last or contains target/label/class)
    let labelCol = null;
    for (const col of columns.reverse()) {
      if (/\b(label|class|target|outcome|result|diagnosis|type|category|species)\b/i.test(col)) {
        labelCol = col;
        break;
      }
    }

    // Split features and label
    for (const col of columns) {
      const value = row[col];
      
      if (col === labelCol) {
        structured.label = value;
      } else if (col.toLowerCase() === 'id') {
        structured.id = parseInt(value) || index + 1;
      } else {
        // Normalize feature names
        const featureName = col
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase()
          .substring(0, 50);
        
        structured.features[featureName] = isNaN(parseFloat(value)) 
          ? String(value).substring(0, 100) 
          : parseFloat(value);
      }
    }

    // Ensure we have at least 2 features
    if (Object.keys(structured.features).length < 2) {
      structured.features = { data: JSON.stringify(row).substring(0, 500) };
    }

    return structured;
  });
}

async function run(topic, options = {}) {
  const { size = 100, format = 'json', silent = false, debug = false } = options;
  
  if (silent) {
    setLevel('silent');
  } else if (debug) {
    setLevel('debug');
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
      const searchQueries = [
        topic,
        topic + ' dataset',
        topic + ' data'
      ];
      
      for (const query of searchQueries) {
        const searchResults = await huggingfaceSource.search(query);
        
        if (searchResults && searchResults.length > 0) {
          // Filter for datasets with downloads
          const sortedResults = searchResults
            .filter(d => d.downloads > 10)
            .sort((a, b) => b.downloads - a.downloads);
          
          // Try up to 50 datasets
          for (const dataset of sortedResults.slice(0, 50)) {
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
  
  let finalRows = allRows.slice(0, size);
  
  // Structure dynamic topics for training
  if (!isPredefined) {
    finalRows = structureForTraining(finalRows, topic);
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
    console.log(`  Mode: ${isPredefined ? 'Real Data' : 'Training Data'}`);
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
    sources: sourcesUsed,
    mode: isPredefined ? 'real' : 'training'
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
