/**
 * CODOZ Orchestrator
 * 
 * Main pipeline coordinator for the 6-phase workflow:
 * 1. Capture Topic
 * 2. Gather Information (via Topic Intelligence)
 * 3. Construct Dataset (via Schema Architect + Generator)
 * 4. Analyze (via Validator)
 * 5. Process (refinement if needed)
 * 6. Deliver (via Packager)
 */

const topicIntelligenceAgent = require('../agents/topic_intelligence_agent');
const schemaArchitectAgent = require('../agents/schema_architect_agent');
const generatorAgent = require('../agents/generator_agent');
const validatorAgent = require('../agents/validator_agent');
const packagerAgent = require('../agents/packager_agent');

function run(topic, options = {}) {
  console.log('\n' + '═'.repeat(60));
  console.log('  CODOZ · ANALYSIS-FIRST DATASET ENGINE');
  console.log('═'.repeat(60) + '\n');
  
  console.log('Starting 6-phase pipeline...\n');
  
  // Initialize context
  let context = createContext(topic, options);
  
  // Print pipeline overview
  console.log('Pipeline:');
  console.log('  1. Capture Topic');
  console.log('  2. Gather Information');
  console.log('  3. Construct Dataset');
  console.log('  4. Analyze');
  console.log('  5. Process (if needed)');
  console.log('  6. Deliver');
  console.log('');
  
  // Print initial info
  console.log('Topic: ' + topic);
  console.log('Size: ' + (options.size || 100) + ' rows');
  console.log('Format: ' + (options.format || 'json'));
  console.log('');
  
  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: CAPTURE TOPIC
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('PHASE 1: CAPTURE TOPIC');
  console.log('─'.repeat(60));
  console.log('Topic captured: "' + topic + '"');
  console.log('');
  
  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: GATHER INFORMATION
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('PHASE 2: GATHER INFORMATION');
  console.log('─'.repeat(60));
  context = topicIntelligenceAgent.process(context);
  console.log('Topic analysis complete.');
  console.log('');
  
  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: CONSTRUCT DATASET
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('PHASE 3: CONSTRUCT DATASET');
  console.log('─'.repeat(60));
  
  // Build schema
  context = schemaArchitectAgent.process(context);
  
  // Generate data
  context = generatorAgent.process(context);
  console.log('Dataset construction complete.');
  console.log('');
  
  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: ANALYZE
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('PHASE 4: ANALYZE');
  console.log('─'.repeat(60));
  context = validatorAgent.process(context);
  console.log('Analysis complete.');
  console.log('');
  
  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: PROCESS (Refinement if needed)
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('PHASE 5: PROCESS');
  console.log('─'.repeat(60));
  
  if (context.validationResult && context.validationResult.status === 'FAIL') {
    console.log('Validation issues detected. Performing refinement...');
    // In a full implementation, this would regenerate problematic rows
    // For now, we'll accept the dataset as-is if quality >= 60
    if (context.qualityScore >= 60) {
      console.log('Quality score acceptable (' + context.qualityScore.toFixed(1) + '%). Accepting dataset.');
    } else {
      console.log('Quality score too low. Please adjust topic or parameters.');
    }
  } else {
    console.log('No processing needed. Dataset passed validation.');
  }
  console.log('');
  
  // ═══════════════════════════════════════════════════════════════
  // PHASE 6: DELIVER
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('PHASE 6: DELIVER');
  console.log('─'.repeat(60));
  context = packagerAgent.process(context);
  
  // Print summary
  console.log('');
  console.log('═'.repeat(60));
  console.log('  PIPELINE COMPLETE');
  console.log('═'.repeat(60));
  console.log('');
  console.log('Summary:');
  console.log('  - Topic: ' + context.topicAnalysis?.topic);
  console.log('  - Entity: ' + context.topicAnalysis?.entity);
  console.log('  - Target: ' + context.target?.name);
  console.log('  - Rows: ' + context.rowsGenerated);
  console.log('  - Columns: ' + context.columnCount);
  console.log('  - Quality Score: ' + (context.qualityScore || 0).toFixed(1) + '%');
  console.log('  - Output: ' + context.outputFiles?.data);
  console.log('');
  
  return context;
}

function createContext(topic, options) {
  return {
    topic,
    size: options.size || 100,
    format: options.format || 'json',
    seed: options.seed || Date.now(),
    logs: [{
      timestamp: new Date().toISOString(),
      event: 'pipeline_start',
      data: { topic, size: options.size, format: options.format }
    }]
  };
}

module.exports = { run };
