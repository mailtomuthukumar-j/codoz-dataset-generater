#!/usr/bin/env node

const { runSync } = require('./core/orchestrator');

function processRequest(input) {
  const topic = input.topic;
  const size = input.size || 500;
  const format = input.format || 'json';
  const seed = input.seed || Math.floor(Math.random() * 1000000);
  
  if (!topic) {
    return {
      success: false,
      data: null,
      meta: null,
      errors: ['Topic is required']
    };
  }
  
  try {
    const context = runSync(topic, { size, format, seed });
    
    return {
      success: true,
      data: {
        dataset: context.dataset,
        row_count: context.dataset?.length || 0
      },
      meta: {
        topic: context.topic,
        domain: context.domain,
        subdomain: context.subdomain,
        task_type: context.task_type,
        target_column: context.target_column,
        format: context.format,
        quality_score: context.final_quality_score,
        schema_source: context.schema?.schema_source
      },
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      meta: null,
      errors: [error.message]
    };
  }
}

const input = JSON.parse(process.argv[2] || '{}');
const result = processRequest(input);
console.log(JSON.stringify(result, null, 2));
