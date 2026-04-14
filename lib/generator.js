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

function generateValue(column, rowIndex, baseSeed) {
  const seed = baseSeed + rowIndex * 1000 + hashString(column.name) % 100;
  const rand = () => seededRandom(seed + rowIndex);
  const normRand = () => normalRandom(seed + rowIndex * 2);
  
  switch (column.type) {
    case 'id': {
      const prefix = column.prefix || 'ID';
      const num = String(rowIndex + 1).padStart(6, '0');
      return `${prefix}${num}`;
    }
    
    case 'integer': {
      const [min, max] = column.range || [0, 100];
      return generateNumericValue(min, max, column.distribution, rand, normRand, true);
    }
    
    case 'float': {
      const [min, max] = column.range || [0, 100];
      return generateNumericValue(min, max, column.distribution, rand, normRand, false);
    }
    
    case 'categorical': {
      const values = column.values || ['A', 'B', 'C'];
      const weights = column.weights;
      
      if (weights) {
        let r = rand() * weights.reduce((a, b) => a + b, 0);
        for (let i = 0; i < values.length; i++) {
          r -= weights[i];
          if (r <= 0) return values[i];
        }
        return values[values.length - 1];
      }
      
      return values[Math.floor(rand() * values.length)];
    }
    
    case 'binary': {
      if (column.distribution === 'biased') {
        return rand() > 0.65 ? 1 : 0;
      }
      return Math.round(rand());
    }
    
    case 'date': {
      const [start, end] = column.range || ['2020-01-01', '2024-12-31'];
      const startDate = new Date(start).getTime();
      const endDate = new Date(end).getTime();
      const date = new Date(startDate + rand() * (endDate - startDate));
      return date.toISOString().split('T')[0];
    }
    
    default:
      return rand() * 100;
  }
}

function generateNumericValue(min, max, distribution, rand, normRand, integer) {
  const mean = (min + max) / 2;
  const std = (max - min) / 6;
  
  let value;
  
  switch (distribution) {
    case 'skewed':
      const r = rand();
      value = min + Math.pow(r, 0.5) * (max - min);
      break;
    
    case 'uniform':
      value = min + rand() * (max - min);
      break;
    
    case 'normal':
    default:
      value = mean + normRand() * std;
      break;
  }
  
  value = Math.max(min, Math.min(max, value));
  
  if (integer) {
    return Math.round(value);
  }
  
  return parseFloat(value.toFixed(2));
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

function create(schema, size) {
  const data = [];
  const baseSeed = Date.now() % 1000000;
  
  for (let i = 0; i < size; i++) {
    const row = {};
    
    for (const column of schema.columns) {
      row[column.name] = generateValue(column, i, baseSeed);
    }
    
    data.push(row);
  }
  
  return data;
}

module.exports = { create };
