function create(topic, dataset, schema, size, format) {
  const columns = schema.columns.map(col => ({
    name: col.name,
    type: col.type,
    ...(col.range && { range: col.range }),
    ...(col.values && { values: col.values })
  }));
  
  const numericColumns = schema.columns.filter(c => c.type === 'integer' || c.type === 'float');
  const stats = {};
  
  for (const col of numericColumns) {
    const values = dataset.map(row => row[col.name]).filter(v => v !== undefined && v !== null && typeof v === 'number');
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      stats[col.name] = {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: parseFloat(mean.toFixed(2)),
        stdDev: parseFloat(Math.sqrt(variance).toFixed(2))
      };
    }
  }
  
  const categoricalColumns = schema.columns.filter(c => c.type === 'categorical');
  const distributions = {};
  
  for (const col of categoricalColumns) {
    const counts = {};
    for (const row of dataset) {
      const val = row[col.name];
      counts[val] = (counts[val] || 0) + 1;
    }
    distributions[col.name] = counts;
  }
  
  return {
    name: `${topic.replace(/\s+/g, '_')}_dataset`,
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    generation_mode: 'dynamic',
    topic,
    domain: schema.domain,
    task_type: schema.taskType || 'classification',
    format,
    size: dataset.length,
    columns,
    stats,
    distributions: Object.keys(distributions).length > 0 ? distributions : undefined,
    correlations: schema.correlations,
    source: 'CODOZ Dynamic Dataset Generator',
    license: 'MIT'
  };
}

module.exports = { create };
