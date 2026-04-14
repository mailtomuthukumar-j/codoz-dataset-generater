const DEFAULT_CONTEXT = {
  topic: null,
  size: 500,
  format: 'json',
  seed: Math.floor(Math.random() * 1000000),
  domain: 'other',
  subdomain: null,
  task_type: 'classification',
  target_column: 'target',
  target_values: null,
  key_entities: [],
  temporal: false,
  geospatial: false,
  search_queries: [],
  schema_refs: [],
  ontology: null,
  schema: null,
  rules: null,
  constraints: [],
  label_distribution: {},
  dataset: null,
  validation_report: null,
  refinement_cycle: 0,
  final_quality_score: 0,
  schema_source: null,
  errors: [],
  logs: []
};

function createContext(overrides = {}) {
  const context = { ...DEFAULT_CONTEXT };
  
  for (const [key, value] of Object.entries(overrides)) {
    if (key in context) {
      context[key] = value;
    } else {
      context.errors.push(`Unknown context key: ${key}`);
    }
  }
  
  context.logs.push({
    timestamp: new Date().toISOString(),
    event: 'context_created',
    data: { topic: context.topic, size: context.size, format: context.format }
  });
  
  return Object.freeze(context);
}

function updateContext(context, updates) {
  const newContext = { ...context };
  
  for (const [key, value] of Object.entries(updates)) {
    if (key in DEFAULT_CONTEXT) {
      newContext[key] = value;
    }
  }
  
  return Object.freeze(newContext);
}

function logEvent(context, event, data = {}) {
  return updateContext(context, {
    logs: [...context.logs, { timestamp: new Date().toISOString(), event, data }]
  });
}

function validateContext(context) {
  const required = ['topic', 'size', 'format'];
  const missing = required.filter(key => !context[key]);
  
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  
  return { valid: true };
}

module.exports = {
  createContext,
  updateContext,
  logEvent,
  validateContext,
  DEFAULT_CONTEXT
};
