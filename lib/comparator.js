function calculateColumnStats(data, columnName) {
  const values = data.map(row => row[columnName]).filter(v => v !== undefined && v !== null);
  
  if (values.length === 0) return null;
  
  const numericValues = values.filter(v => typeof v === 'number');
  
  if (numericValues.length === values.length) {
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev, min: Math.min(...numericValues), max: Math.max(...numericValues) };
  }
  
  const counts = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  
  return { distribution: counts, unique: Object.keys(counts).length };
}

function isRealistic(data, schema) {
  if (!data || data.length === 0) return false;
  
  if (data.length < 10) return true;
  
  for (const column of schema.columns) {
    if (column.type === 'id') continue;
    
    const stats = calculateColumnStats(data, column.name);
    if (!stats) continue;
    
    if (stats.stdDev !== undefined) {
      if (stats.stdDev === 0) return false;
      
      const cv = stats.stdDev / Math.max(stats.mean, 1);
      if (column.type === 'float' && cv > 5) return false;
    }
    
    if (column.type === 'categorical' && stats.unique !== undefined) {
      if (stats.unique === data.length) return false;
      if (stats.unique > 50) return false;
    }
  }
  
  return true;
}

function getRealismScore(data, schema) {
  let score = 100;
  
  for (const column of schema.columns) {
    const stats = calculateColumnStats(data, column.name);
    if (!stats) continue;
    
    if (stats.stdDev !== undefined && stats.stdDev === 0) {
      score -= 10;
    }
    
    if (column.type === 'categorical' && stats.unique === data.length) {
      score -= 15;
    }
  }
  
  return Math.max(0, score);
}

module.exports = { isRealistic, getRealismScore };
