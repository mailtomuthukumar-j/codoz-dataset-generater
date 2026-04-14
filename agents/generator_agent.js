function generateUUIDv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function normalRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function process(context) {
  const schema = context.schema;
  const size = context.size;
  const seed = context.seed || Date.now();
  const label_distribution = context.label_distribution || {};
  const constraints = schema?.constraints || [];
  const domain = context.domain;
  
  if (!schema || !schema.columns) {
    return {
      ...context,
      dataset: [],
      logs: [...context.logs, { timestamp: new Date().toISOString(), event: 'generator_error', data: { error: 'No schema' } }]
    };
  }
  
  const dataset = [];
  const idSet = new Set();
  const targetColumn = schema.columns.find(c => c.is_target);
  const targetValues = targetColumn?.categories || [0, 1];
  const targetDistribution = calculateTargetDistribution(targetValues, label_distribution, size);
  
  for (let i = 0; i < size; i++) {
    let row = null;
    let attempts = 0;
    
    while (attempts < 10) {
      const candidateRow = generateRow(schema.columns, constraints, i, seed, targetColumn, targetValues, targetDistribution[i], domain);
      
      const idVal = candidateRow.id;
      if (idVal && idSet.has(idVal)) {
        attempts++;
        continue;
      }
      
      row = candidateRow;
      if (idVal) idSet.add(idVal);
      break;
    }
    
    if (!row) {
      row = generateRow(schema.columns, constraints, i, seed, targetColumn, targetValues, targetDistribution[i], domain);
    }
    
    dataset.push(row);
  }
  
  return {
    ...context,
    dataset,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'generation_complete',
      data: { row_count: dataset.length, unique_ids: idSet.size }
    }]
  };
}

function generateRow(columns, constraints, index, baseSeed, targetColumn, targetValues, targetValue, domain) {
  const row = {};
  const seed = baseSeed + index * 1000 + (Date.now() % 1000);
  
  const sortedColumns = [...columns].sort((a, b) => {
    const orderA = a.generation_order || 5;
    const orderB = b.generation_order || 5;
    return orderA - orderB;
  });
  
  for (const col of sortedColumns) {
    if (col.is_target) {
      row[col.name] = targetValue;
    } else if (col.dtype === 'uuid') {
      row[col.name] = generateUUIDv4();
    } else {
      row[col.name] = generateValue(col, seed, row, targetValue, targetColumn, domain);
    }
  }
  
  return row;
}

function generateValue(column, seed, rowContext, targetValue, targetColumn, domain) {
  const rand = () => seededRandom(seed + Date.now() % 1000);
  const normRand = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
  
  const [min, max] = column.range || [0, 100];
  
  switch (column.dtype) {
    case 'int': {
      const mean = (min + max) / 2;
      const std = (max - min) / 6;
      const value = Math.round(Math.max(min, Math.min(max, mean + normRand() * std)));
      return value;
    }
    
    case 'float': {
      const mean = (min + max) / 2;
      const std = (max - min) / 6;
      let value = mean + normRand() * std;
      value = Math.max(min, Math.min(max, value));
      return parseFloat(value.toFixed(2));
    }
    
    case 'categorical': {
      const values = column.categories || ['A', 'B', 'C'];
      return values[Math.floor(rand() * values.length)];
    }
    
    case 'boolean':
      return rand() > 0.5;
    
    case 'ordinal': {
      const values = column.categories || ['low', 'medium', 'high'];
      return values[Math.floor(rand() * values.length)];
    }
    
    case 'datetime': {
      const start = new Date('2020-01-01').getTime();
      const end = new Date('2024-12-31').getTime();
      return new Date(start + rand() * (end - start)).toISOString();
    }
    
    case 'uuid':
      return generateUUIDv4();
    
    default: {
      if (Number.isInteger(min) && Number.isInteger(max)) {
        return Math.round(min + rand() * (max - min));
      }
      return parseFloat((min + rand() * (max - min)).toFixed(2));
    }
  }
}

function calculateTargetDistribution(targetValues, labelDistribution, size) {
  const distribution = [];
  const weights = {};
  
  if (typeof labelDistribution === 'object' && !Array.isArray(labelDistribution)) {
    Object.assign(weights, labelDistribution);
  } else if (targetValues.length === 2) {
    weights[targetValues[0]] = 0.65;
    weights[targetValues[1]] = 0.35;
  } else {
    const equal = 1 / targetValues.length;
    for (const v of targetValues) {
      weights[v] = equal;
    }
  }
  
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  
  for (let i = 0; i < size; i++) {
    const r = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (const [value, weight] of entries) {
      cumulative += weight;
      if (r <= cumulative) {
        distribution.push(value);
        break;
      }
    }
    
    if (distribution.length <= i) {
      distribution.push(entries[0][0]);
    }
  }
  
  return distribution;
}

module.exports = { process };
