function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function normalRandom(seed) {
  let u = 0, v = 0;
  while (u === 0) u = seededRandom(seed++);
  while (v === 0) v = seededRandom(seed++);
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function process(context) {
  const schema = context.schema;
  const size = context.size;
  const seed = context.seed;
  const label_distribution = context.label_distribution || {};
  const constraints = context.schema?.constraints || [];
  
  if (!schema || !schema.columns) {
    return {
      ...context,
      dataset: [],
      logs: [...context.logs, { timestamp: new Date().toISOString(), event: 'generator_error', data: { error: 'No schema provided' } }]
    };
  }
  
  const dataset = [];
  const rowHashes = new Set();
  const targetColumn = schema.columns.find(c => c.is_target);
  const targetValues = targetColumn?.categories || [0, 1];
  const targetDistribution = calculateTargetDistribution(targetValues, label_distribution, size);
  
  for (let i = 0; i < size; i++) {
    let row = null;
    let attempts = 0;
    
    while (attempts < 10) {
      const candidateRow = generateRow(schema.columns, constraints, i, seed, targetColumn, targetValues, targetDistribution[i]);
      
      if (candidateRow) {
        const hash = hashRow(candidateRow);
        
        if (!rowHashes.has(hash)) {
          row = candidateRow;
          rowHashes.add(hash);
          break;
        }
      }
      attempts++;
    }
    
    if (!row) {
      row = generateRow(schema.columns, constraints, i, seed, targetColumn, targetValues, targetDistribution[i]);
    }
    
    dataset.push(row);
  }
  
  return {
    ...context,
    dataset,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'generation_complete',
      data: { row_count: dataset.length, column_count: schema.columns.length }
    }]
  };
}

function generateRow(columns, constraints, index, baseSeed, targetColumn, targetValues, targetValue) {
  const row = {};
  const seed = baseSeed + index * 1000;
  
  for (const col of columns) {
    if (col.is_target) {
      row[col.name] = targetValue;
      continue;
    }
    
    row[col.name] = generateColumnValue(col, index, seed, row, targetValue);
  }
  
  for (const constraint of constraints) {
    if (constraint.type === 'correlation' && constraint.strength >= 0.7) {
      applyCorrelationConstraint(row, constraint, index, seed);
    }
  }
  
  return row;
}

function generateColumnValue(column, index, seed, context, targetValue) {
  const rand = () => seededRandom(seed + index * 100 + hashString(column.name));
  const normRand = () => normalRandom(seed + index * 100 + hashString(column.name));
  
  switch (column.dtype) {
    case 'int': {
      const [min, max] = column.range || [0, 100];
      return Math.round(min + rand() * (max - min));
    }
    
    case 'float': {
      const [min, max] = column.range || [0, 100];
      const mean = (min + max) / 2;
      const std = (max - min) / 6;
      let value = mean + normRand() * std;
      value = Math.max(min, Math.min(max, value));
      return parseFloat(value.toFixed(2));
    }
    
    case 'categorical': {
      const values = column.categories || ['A', 'B', 'C'];
      if (column.categories && column.categories.length > 0) {
        return values[Math.floor(rand() * values.length)];
      }
      return values[Math.floor(rand() * values.length)];
    }
    
    case 'ordinal': {
      const values = column.categories || ['Low', 'Medium', 'High'];
      return values[Math.floor(rand() * values.length)];
    }
    
    case 'boolean': {
      return rand() > 0.5;
    }
    
    case 'datetime': {
      const start = new Date('2020-01-01').getTime();
      const end = new Date('2024-12-31').getTime();
      const date = new Date(start + rand() * (end - start));
      return date.toISOString();
    }
    
    default: {
      const [min, max] = column.range || [0, 100];
      return parseFloat((min + rand() * (max - min)).toFixed(2));
    }
  }
}

function calculateTargetDistribution(targetValues, labelDistribution, size) {
  const distribution = [];
  
  let weights = {};
  if (typeof labelDistribution === 'object' && !Array.isArray(labelDistribution)) {
    weights = labelDistribution;
  } else if (Array.isArray(labelDistribution)) {
    for (let i = 0; i < labelDistribution.length; i++) {
      weights[labelDistribution[i]] = 1 / labelDistribution.length;
    }
  } else {
    if (targetValues.length === 2) {
      weights = { [targetValues[0]]: 0.65, [targetValues[1]]: 0.35 };
    } else {
      const equal = 1 / targetValues.length;
      for (const v of targetValues) {
        weights[v] = equal;
      }
    }
  }
  
  const weightEntries = Object.entries(weights);
  const totalWeight = weightEntries.reduce((sum, [, w]) => sum + w, 0);
  
  for (let i = 0; i < size; i++) {
    const rand = seededRandom(i * 1000 + Date.now());
    let cumulative = 0;
    
    for (const [value, weight] of weightEntries) {
      cumulative += weight / totalWeight;
      if (rand <= cumulative) {
        distribution.push(value);
        break;
      }
    }
    
    if (distribution.length <= i) {
      distribution.push(weightEntries[0][0]);
    }
  }
  
  return distribution;
}

function applyCorrelationConstraint(row, constraint, index, seed) {
  return;
}

function hashRow(row) {
  const str = JSON.stringify(row);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

module.exports = { process };
