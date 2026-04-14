function process(context) {
  const search_queries = context.search_queries || [];
  
  if (search_queries.length === 0) {
    return {
      ...context,
      schema_refs: [],
      logs: [...context.logs, {
        timestamp: new Date().toISOString(),
        event: 'discovery_complete',
        data: { ref_count: 0, mode: 'inference_only' }
      }]
    };
  }
  
  const schema_refs = search_queries.map(query => ({
    source: 'Web Search',
    dataset_name: `Dataset for: ${query}`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    columns: [],
    row_count: null,
    target_column: context.target_column || 'target',
    label_distribution: null,
    notable_correlations: []
  }));
  
  return {
    ...context,
    schema_refs: schema_refs.slice(0, 3),
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'discovery_complete',
      data: { ref_count: schema_refs.length, mode: 'dynamic_search' }
    }]
  };
}

module.exports = { process };
