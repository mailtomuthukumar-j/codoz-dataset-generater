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
  
  for (let i = 0; i < size; i++) {
    let row = null;
    let attempts = 0;
    
    while (attempts < 10) {
      const candidateRow = generateRow(schema.columns, i, seed, targetColumn, targetValues, label_distribution, domain);
      
      const idCol = schema.columns.find(c => c.is_id);
      if (idCol && idSet.has(candidateRow[idCol.name])) {
        attempts++;
        continue;
      }
      
      row = candidateRow;
      if (idCol) {
        idSet.add(row[idCol.name]);
      }
      break;
    }
    
    if (!row) {
      row = generateRow(schema.columns, i, seed, targetColumn, targetValues, label_distribution, domain);
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

function generateRow(columns, index, baseSeed, targetColumn, targetValues, labelDistribution, domain) {
  const row = {};
  const seed = baseSeed + index * 1000 + Date.now() % 1000;
  
  const targetValue = generateTargetValue(targetColumn, index, seed, labelDistribution);
  
  for (const col of columns) {
    if (col.is_target) {
      row[col.name] = targetValue;
      continue;
    }
    
    if (col.is_id) {
      row[col.name] = generateId(col, index, seed, domain);
      continue;
    }
    
    row[col.name] = generateValue(col, index, seed, row, targetValue, targetColumn);
  }
  
  return row;
}

function generateId(column, index, seed, domain) {
  const prefix = column.prefix || domain?.slice(0, 3).toUpperCase() || 'ID';
  const num = String(index + 1).padStart(6, '0');
  return `${prefix}${num}`;
}

function generateTargetValue(targetColumn, index, seed, labelDistribution) {
  if (!targetColumn || !labelDistribution || Object.keys(labelDistribution).length === 0) {
    return Math.random() > 0.5 ? 'Yes' : 'No';
  }
  
  const rand = seededRandom(seed + index);
  let cumulative = 0;
  const entries = Object.entries(labelDistribution);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  
  for (const [value, weight] of entries) {
    cumulative += weight / total;
    if (rand <= cumulative) {
      return value;
    }
  }
  
  return entries[entries.length - 1][0];
}

function generateValue(column, index, seed, context, targetValue, targetColumn) {
  const rand = () => seededRandom(seed + index * 100 + hashString(column.name));
  const normRand = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
  
  switch (column.dtype) {
    case 'int': {
      const [min, max] = column.range || [0, 100];
      const dist = column.distribution || 'normal';
      
      if (dist === 'skewed') {
        const r = rand();
        return Math.round(min + Math.pow(r, 0.5) * (max - min));
      }
      
      const mean = (min + max) / 2;
      const std = (max - min) / 6;
      return Math.round(Math.max(min, Math.min(max, mean + normRand() * std)));
    }
    
    case 'float': {
      const [min, max] = column.range || [0, 100];
      const dist = column.distribution || 'normal';
      
      let value;
      if (dist === 'skewed') {
        const r = rand();
        value = min + Math.pow(r, 0.5) * (max - min);
      } else {
        const mean = (min + max) / 2;
        const std = (max - min) / 6;
        value = mean + normRand() * std;
      }
      
      return parseFloat(Math.max(min, Math.min(max, value)).toFixed(2));
    }
    
    case 'categorical': {
      const values = column.categories || ['A', 'B', 'C'];
      return values[Math.floor(rand() * values.length)];
    }
    
    case 'boolean':
      return rand() > 0.5;
    
    case 'datetime': {
      const start = new Date('2022-01-01').getTime();
      const end = new Date('2024-12-31').getTime();
      return new Date(start + rand() * (end - start)).toISOString();
    }
    
    default: {
      const [min, max] = column.range || [0, 100];
      return parseFloat((min + rand() * (max - min)).toFixed(2));
    }
  }
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
