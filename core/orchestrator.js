const { createContext } = require('./context_object');
const topicIntelligenceAgent = require('../agents/topic_intelligence_agent');
const discoveryAgent = require('../agents/discovery_agent');
const schemaArchitectAgent = require('../agents/schema_architect_agent');
const generatorAgent = require('../agents/generator_agent');
const validatorAgent = require('../agents/validator_agent');
const refinementAgent = require('../agents/refinement_agent');
const packagerAgent = require('../agents/packager_agent');

const MAX_REFINEMENT_CYCLES = 3;

async function run(topic, options = {}) {
  console.log('\n========================================');
  console.log('CODOZ - AI Dataset Factory');
  console.log('========================================\n');
  
  let context = createContext({
    topic,
    size: options.size || 500,
    format: options.format || 'json',
    seed: options.seed || Math.floor(Math.random() * 1000000)
  });
  
  console.log(`Topic: ${topic}`);
  console.log(`Size: ${context.size}`);
  console.log(`Format: ${context.format}`);
  console.log('');
  
  console.log('[1/8] Topic Intelligence...');
  context = topicIntelligenceAgent.process(context);
  console.log(`  Domain: ${context.domain}`);
  console.log(`  Subdomain: ${context.subdomain}`);
  console.log(`  Task: ${context.task_type}`);
  console.log(`  Target: ${context.target_column}`);
  console.log('');
  
  console.log('[2/8] Discovery Agent...');
  if (context.search_queries && context.search_queries.length > 0) {
    context = discoveryAgent.process(context);
    console.log(`  Schema references found: ${context.schema_refs?.length || 0}`);
  } else {
    console.log('  Skipped (no search queries)');
  }
  console.log('');
  
  console.log('[3/8] Schema Architect...');
  context = schemaArchitectAgent.process(context);
  const columnCount = context.schema?.columns?.length || 0;
  console.log(`  Columns generated: ${columnCount}`);
  console.log(`  Schema source: ${context.schema?.schema_source || 'unknown'}`);
  console.log('');
  
  console.log('[4/8] Generator...');
  context = generatorAgent.process(context);
  console.log(`  Rows generated: ${context.dataset?.length || 0}`);
  console.log('');
  
  console.log('[5/8] Validator...');
  context = validatorAgent.process(context);
  const validation = context.validation_report;
  console.log(`  Status: ${validation?.status || 'UNKNOWN'}`);
  console.log(`  Quality Score: ${(validation?.overall_score || 0).toFixed(1)}/100`);
  console.log(`  Failures: ${validation?.failures?.length || 0}`);
  console.log('');
  
  let refinementCycle = 0;
  
  while (validation?.status === 'FAIL' && refinementCycle < MAX_REFINEMENT_CYCLES) {
    refinementCycle++;
    console.log(`[6/8] Refinement (Cycle ${refinementCycle}/${MAX_REFINEMENT_CYCLES})...`);
    context = refinementAgent.process(context);
    console.log(`  Patches applied: ${context.patches_applied || 0}`);
    console.log(`  Rows affected: ${context.rows_affected?.length || 0}`);
    console.log('');
    
    console.log(`[7/8] Re-validation...`);
    context = validatorAgent.process(context);
    console.log(`  Status: ${context.validation_report?.status || 'UNKNOWN'}`);
    console.log(`  Quality Score: ${(context.validation_report?.overall_score || 0).toFixed(1)}/100`);
    console.log('');
  }
  
  if (refinementCycle > 0) {
    console.log(`[7/8] Final Validation...`);
  }
  
  console.log('[8/8] Packager...');
  context = packagerAgent.process(context);
  console.log('');
  
  console.log('========================================');
  console.log('Pipeline Complete');
  console.log('========================================\n');
  
  return context;
}

function runSync(topic, options = {}) {
  console.log('\n========================================');
  console.log('CODOZ - AI Dataset Factory');
  console.log('========================================\n');
  
  let context = createContext({
    topic,
    size: options.size || 500,
    format: options.format || 'json',
    seed: options.seed || Math.floor(Math.random() * 1000000)
  });
  
  console.log(`Topic: ${topic}`);
  console.log(`Size: ${context.size}`);
  console.log(`Format: ${context.format}`);
  console.log('');
  
  console.log('[1/8] Topic Intelligence...');
  context = topicIntelligenceAgent.process(context);
  console.log(`  Domain: ${context.domain}`);
  console.log(`  Subdomain: ${context.subdomain}`);
  console.log(`  Task: ${context.task_type}`);
  console.log(`  Target: ${context.target_column}`);
  console.log('');
  
  console.log('[2/8] Discovery Agent...');
  if (context.search_queries && context.search_queries.length > 0) {
    context = discoveryAgent.process(context);
    console.log(`  Schema references found: ${context.schema_refs?.length || 0}`);
  } else {
    console.log('  Skipped (no search queries)');
  }
  console.log('');
  
  console.log('[3/8] Schema Architect...');
  context = schemaArchitectAgent.process(context);
  const columnCount = context.schema?.columns?.length || 0;
  console.log(`  Columns generated: ${columnCount}`);
  console.log(`  Schema source: ${context.schema?.schema_source || 'unknown'}`);
  console.log('');
  
  console.log('[4/8] Generator...');
  context = generatorAgent.process(context);
  console.log(`  Rows generated: ${context.dataset?.length || 0}`);
  console.log('');
  
  console.log('[5/8] Validator...');
  context = validatorAgent.process(context);
  const validation = context.validation_report;
  console.log(`  Status: ${validation?.status || 'UNKNOWN'}`);
  console.log(`  Quality Score: ${(validation?.overall_score || 0).toFixed(1)}/100`);
  console.log(`  Failures: ${validation?.failures?.length || 0}`);
  console.log('');
  
  let refinementCycle = 0;
  
  while (validation?.status === 'FAIL' && refinementCycle < MAX_REFINEMENT_CYCLES) {
    refinementCycle++;
    console.log(`[6/8] Refinement (Cycle ${refinementCycle}/${MAX_REFINEMENT_CYCLES})...`);
    context = refinementAgent.process(context);
    console.log(`  Patches applied: ${context.patches_applied || 0}`);
    console.log(`  Rows affected: ${context.rows_affected?.length || 0}`);
    console.log('');
    
    console.log(`[7/8] Re-validation...`);
    context = validatorAgent.process(context);
    console.log(`  Status: ${context.validation_report?.status || 'UNKNOWN'}`);
    console.log(`  Quality Score: ${(context.validation_report?.overall_score || 0).toFixed(1)}/100`);
    console.log('');
  }
  
  if (refinementCycle > 0) {
    console.log(`[7/8] Final Validation...`);
  }
  
  console.log('[8/8] Packager...');
  context = packagerAgent.process(context);
  console.log('');
  
  console.log('========================================');
  console.log('Pipeline Complete');
  console.log('========================================\n');
  
  return context;
}

module.exports = { run, runSync };
