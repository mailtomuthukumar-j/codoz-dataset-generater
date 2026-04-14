function create(topic, dataset, schema, size, format) {
  const columns = schema.columns.map(col => ({
    name: col.name,
    type: col.type,
    nullable: false
  }));
  
  const numericColumns = schema.columns.filter(c => c.type === 'integer' || c.type === 'float');
  const stats = {};
  
  for (const col of numericColumns) {
    const values = dataset.map(row => row[col.name]).filter(v => v !== undefined && v !== null);
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      stats[col.name] = {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: parseFloat((sum / values.length).toFixed(2))
      };
    }
  }
  
  return {
    name: `${topic.replace(/\s+/g, '_')}_dataset`,
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    topic,
    domain: schema.domain,
    format,
    size: dataset.length,
    columns,
    stats,
    source: 'CODOZ Dataset Generator',
    license: 'MIT'
  };
}

module.exports = { create };
