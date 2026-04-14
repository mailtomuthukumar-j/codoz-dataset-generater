/**
 * CODOZ Orchestrator
 * 
 * Main pipeline coordinator for the 6-phase workflow.
 * Supports both verbose and silent modes.
 */

const topicIntelligenceAgent = require('../agents/topic_intelligence_agent');
const schemaArchitectAgent = require('../agents/schema_architect_agent');
const generatorAgent = require('../agents/generator_agent');
const validatorAgent = require('../agents/validator_agent');
const packagerAgent = require('../agents/packager_agent');

function run(topic, options = {}, silent = false) {
  let context = createContext(topic, options, silent);
  
  if (!silent) {
    console.log('\n' + '═'.repeat(60));
    console.log('  CODOZ · ANALYSIS-FIRST DATASET ENGINE');
    console.log('═'.repeat(60) + '\n');
    console.log('Topic: ' + topic);
    console.log('Size: ' + (options.size || 100) + ' rows');
    console.log('Format: ' + (options.format || 'json') + '\n');
  }
  
  context = topicIntelligenceAgent.process(context);
  context = schemaArchitectAgent.process(context);
  context = generatorAgent.process(context);
  context = validatorAgent.process(context);
  context = packagerAgent.process(context);
  
  const outputFile = context.outputFiles?.data || '';
  
  if (silent) {
    console.log('Successfully created');
  } else {
    console.log('\n' + '═'.repeat(60));
    console.log('  PIPELINE COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n  Output: ' + outputFile);
    console.log('  Quality: ' + (context.qualityScore || 0).toFixed(0) + '%');
    console.log('');
  }
  
  return context;
}

function createContext(topic, options, silent) {
  return {
    topic,
    size: options.size || 100,
    format: options.format || 'json',
    seed: options.seed || Date.now(),
    silent,
    logs: []
  };
}

module.exports = { run };
