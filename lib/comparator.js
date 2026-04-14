function calculateColumnStats(data, columnName) {
  const values = data.map(row => row[columnName]).filter(v => v !== undefined && v !== null);
  
  if (values.length === 0) return null;
  
  const numericValues = values.filter(v => typeof v === 'number');
  
  if (numericValues.length === values.length) {
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length;
    
    return {
      type: 'numeric',
      mean,
      stdDev: Math.sqrt(variance),
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      unique: numericValues.length
    };
  }
  
  const counts = {};
  for (const v of values) {
    const key = String(v);
    counts[key] = (counts[key] || 0) + 1;
  }
  
  return {
    type: 'categorical',
    distribution: counts,
    unique: Object.keys(counts).length
  };
}

function isRealistic(data, schema) {
  if (!data || data.length === 0) return false;
  
  if (data.length < 10) return true;
  
  for (const column of schema.columns) {
    if (column.type === 'id') continue;
    
    const stats = calculateColumnStats(data, column.name);
    if (!stats) continue;
    
    if (stats.type === 'numeric') {
      if (stats.stdDev === 0) return false;
      
      const cv = stats.stdDev / Math.max(Math.abs(stats.mean), 1);
      if (cv > 10) return false;
    }
    
    if (stats.type === 'categorical') {
      if (stats.unique === data.length) return false;
      if (stats.unique > data.length * 0.8) return false;
    }
  }
  
  return true;
}

function getRealismScore(data, schema) {
  let score = 100;
  const penalties = [];
  
  for (const column of schema.columns) {
    if (column.type === 'id') continue;
    
    const stats = calculateColumnStats(data, column.name);
    if (!stats) continue;
    
    if (stats.type === 'numeric') {
      if (stats.stdDev === 0) {
        score -= 15;
        penalties.push(`${column.name}: zero variance`);
      }
      
      const cv = stats.stdDev / Math.max(Math.abs(stats.mean), 1);
      if (cv > 5) {
        score -= 5;
        penalties.push(`${column.name}: high variance`);
      }
    }
    
    if (stats.type === 'categorical') {
      if (stats.unique === data.length) {
        score -= 20;
        penalties.push(`${column.name}: all unique values`);
      }
    }
  }
  
  return {
    score: Math.max(0, score),
    penalties: penalties.length > 0 ? penalties : undefined
  };
}

module.exports = { isRealistic, getRealismScore };
