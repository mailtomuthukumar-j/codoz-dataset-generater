/**
 * CODOZ Real Data Engine
 * Main orchestrator for fetching real-world datasets
 */

const domainDetector = require('./core/domain-detector');
const sourceFinder = require('./core/source-finder');
const fetcher = require('./core/fetcher');
const formatter = require('./core/formatter');
const qualityReporter = require('./core/quality-reporter');
const pipeline = require('./core/pipeline');
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
    console.log(`Size: ${size} rows (fetching 3x for quality filtering)`);
    console.log(`Format: ${format}\n`);
  }
  
  logger.info(`Starting fetch for: ${topic}`);
  
  const topicInfo = domainDetector.detectDomain(topic);
  logger.info(`Detected domain: ${topicInfo.domainFamily}, topicKey: ${topicInfo.topicKey || 'none'}`);
  
  const sourceInfo = sourceFinder.findBestSources(topicInfo);
  logger.info(`Available sources: ${JSON.stringify(sourceInfo.availableSources)}`);
  logger.info(`Recommended sources: ${sourceInfo.recommended.length}`);
  
  let result;
  let fetchMethod = 'primary';
  
  try {
    result = await pipeline.runPipeline(
      topicInfo,
      sourceInfo,
      size,
      async (config, opts) => await fetcher.fetchDataset(config, opts)
    );
  } catch (error) {
    if (!silent) {
      console.log('\n⚠️  REAL DATA NOT AVAILABLE\n');
      console.log(error.message);
      console.log('\nThis system only provides real data from verified sources.');
      console.log('No synthetic or fake data is generated.\n');
    }
    throw new Error(error.message);
  }
  
  if (!result || !result.success || !result.data) {
    throw new Error('Could not fetch real data from any source. No synthetic data generated.');
  }
  
  const formatted = formatter.formatDataset({ rows: result.data, schema: result.schema }, format, {
    topic,
    pretty: true
  });
  
  const saved = formatter.saveToFile(formatted.content, formatted.filename, {
    format
  });
  
  const qualityReport = qualityReporter.generateQualityReport(
    { rows: result.data, schema: result.schema },
    {
      topic,
      sources: result.metadata.sourcesUsed ? [result.metadata.sourceInfo] : [],
      pipelineReport: result.pipelineReport,
      validationResults: { qualityScore: result.metadata.qualityScore }
    }
  );
  
  if (!silent) {
    console.log('\n' + '═'.repeat(60));
    console.log('  FETCH COMPLETE');
    console.log('═'.repeat(60));
    console.log(`\n  Output: ${saved.filepath}`);
    console.log(`  Rows: ${formatted.rowCount}`);
    console.log(`  Format: ${format}`);
    console.log(`  Method: ${result.metadata.method || fetchMethod}`);
    console.log(`  Quality Score: ${result.metadata.qualityScore}%`);
    console.log(`  Fetched: ${result.metadata.fetchedCount || 'N/A'}`);
    console.log(`  Deduplicated: ${result.metadata.duplicatesRemoved || 0}`);
    console.log('\n  Data Sources:');
    if (qualityReport.sources.sources) {
      qualityReport.sources.sources.forEach(src => {
        console.log(`    • ${src.name}: ${src.records} records (${src.percentage}) - ${src.description}`);
        console.log(`      Source ID: ${src.identifier}`);
      });
    }
    console.log('');
  }
  
  return {
    success: true,
    output: saved,
    rowCount: result.data.length,
    format,
    method: result.metadata.method || fetchMethod,
    qualityScore: result.metadata.qualityScore,
    metadata: result.metadata,
    pipelineReport: result.pipelineReport,
    qualityReport
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
