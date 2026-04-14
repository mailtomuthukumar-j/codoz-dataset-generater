const { createContext } = require('./context_object');
const topicIntelligenceAgent = require('../agents/topic_intelligence_agent');
const discoveryAgent = require('../agents/discovery_agent');
const schemaArchitectAgent = require('../agents/schema_architect_agent');
const logicRulesAgent = require('../agents/logic_rules_agent');
const generatorAgent = require('../agents/generator_agent');
const validatorAgent = require('../agents/validator_agent');
const refinementAgent = require('../agents/refinement_agent');
const packagerAgent = require('../agents/packager_agent');

const MAX_REFINEMENT_CYCLES = 3;

async function run(topic, options = {}) {
  console.log('\n========================================');
  console.log('CODOZ - ANALYSIS-FIRST DATASET ENGINE');
  console.log('========================================\n');
  
  console.log('PHASE 1: ANALYSIS\n');
  
  let context = createContext({
    topic,
    size: options.size || 500,
    format: options.format || 'json',
    seed: options.seed || Math.floor(Math.random() * 1000000)
  });
  
  console.log(`Topic: ${topic}`);
  console.log(`Requested Size: ${context.size}`);
  console.log(`Format: ${context.format}`);
  console.log('');
  
  console.log('[1/6] Topic Intelligence...');
  context = topicIntelligenceAgent.process(context);
  console.log(`  Domain: ${context.domain}`);
  console.log(`  Subdomain: ${context.subdomain}`);
  console.log(`  ML Task: ${context.task_type}`);
  console.log(`  Target: ${context.target_column}`);
  console.log(`  Entities: ${context.ontology?.core_entities?.join(', ') || 'N/A'}`);
  console.log('');
  
  console.log('[2/6] Discovery Agent...');
  if (context.search_queries && context.search_queries.length > 0) {
    context = discoveryAgent.process(context);
    console.log(`  Schema references found: ${context.schema_refs?.length || 0}`);
  } else {
    console.log('  Skipped (no search queries)');
  }
  console.log('');
  
  console.log('[3/6] Schema Architect...');
  context = schemaArchitectAgent.process(context);
  const columnCount = context.schema?.columns?.length || 0;
  console.log(`  Columns defined: ${columnCount}`);
  console.log(`  Schema source: ${context.schema?.schema_source || 'unknown'}`);
  console.log('');
  
  console.log('[4/6] Logic & Rules...');
  context = logicRulesAgent.process(context);
  const rules = context.rules || {};
  console.log(`  Deterministic constraints: ${rules.deterministic?.length || 0}`);
  console.log(`  Correlations defined: ${rules.correlations?.length || 0}`);
  console.log(`  Generation order: ${rules.generation_order?.slice(0, 3).join(' → ') || 'default'} → ...`);
  console.log('');
  
  console.log('PHASE 2: EXECUTION\n');
  
  console.log('[5/6] Generator...');
  context = generatorAgent.process(context);
  console.log(`  Rows generated: ${context.dataset?.length || 0}`);
  console.log(`  Using causal generation order: ${context.rules?.generation_order ? 'YES' : 'NO'}`);
  console.log('');
  
  console.log('PHASE 3: QA LOOP\n');
  
  console.log('[6/6] Validator...');
  context = validatorAgent.process(context);
  const validation = context.validation_report;
  console.log(`  Status: ${validation?.status || 'UNKNOWN'}`);
  console.log(`  Quality Score: ${(validation?.overall_score || 0).toFixed(1)}/100`);
  console.log(`  Tests Passed: ${validation?.test_results ? Object.values(validation.test_results).filter(t => t.passed).length : 0}/${validation?.test_results ? Object.keys(validation.test_results).length : 0}`);
  if (validation?.violations?.length > 0) {
    console.log(`  Violations: ${validation.violations.length}`);
  }
  console.log('');
  
  let refinementCycle = 0;
  
  while (validation?.status === 'FAIL' && refinementCycle < MAX_REFINEMENT_CYCLES) {
    refinementCycle++;
    console.log(`  Refinement Cycle ${refinementCycle}/${MAX_REFINEMENT_CYCLES}...`);
    context = refinementAgent.process(context);
    console.log(`    Patches applied: ${context.patches_applied || 0}`);
    console.log(`    Rows affected: ${context.rows_affected?.length || 0}`);
    
    context = validatorAgent.process(context);
    console.log(`    Re-validation score: ${(context.validation_report?.overall_score || 0).toFixed(1)}/100`);
    console.log('');
  }
  
  if (refinementCycle > 0) {
    console.log(`  Final validation after ${refinementCycle} refinement cycle(s)`);
    console.log(`  Final Status: ${context.validation_report?.status}`);
    console.log(`  Final Score: ${(context.validation_report?.overall_score || 0).toFixed(1)}/100`);
    console.log('');
  }
  
  console.log('PHASE 4: OUTPUT\n');
  
  console.log('[7/6] Packager...');
  context = packagerAgent.process(context);
  console.log('');
  
  console.log('========================================');
  console.log('Pipeline Complete');
  console.log('========================================\n');
  
  return context;
}

function runSync(topic, options = {}) {
  return run(topic, options);
}

module.exports = { run, runSync };
