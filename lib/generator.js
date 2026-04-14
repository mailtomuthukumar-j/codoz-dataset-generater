function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generateValue(column, index, seed, correlationCache) {
  const rand = () => seededRandom(seed + index * 100 + column.name.length);
  const normalRandom = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
  
  switch (column.type) {
    case 'id':
      const prefix = column.prefix || 'ID';
      return `${prefix}${String(index + 1).padStart(6, '0')}`;
    
    case 'integer': {
      const [min, max] = column.range || [0, 100];
      if (column.distribution === 'skewed') {
        const r = rand();
        return Math.floor(min + Math.pow(r, 0.5) * (max - min));
      }
      const mean = (min + max) / 2;
      const std = (max - min) / 6;
      return Math.max(min, Math.min(max, Math.round(mean + normalRandom() * std)));
    }
    
    case 'float': {
      const [min, max] = column.range || [0, 100];
      if (column.distribution === 'skewed') {
        const r = rand();
        return parseFloat((min + Math.pow(r, 0.5) * (max - min)).toFixed(2));
      }
      const mean = (min + max) / 2;
      const std = (max - min) / 6;
      return parseFloat((mean + normalRandom() * std).toFixed(2));
    }
    
    case 'categorical': {
      const values = column.values || [0, 1];
      const weights = column.weights || values.map(() => 1 / values.length);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let r = rand() * totalWeight;
      for (let i = 0; i < values.length; i++) {
        r -= weights[i];
        if (r <= 0) return values[i];
      }
      return values[values.length - 1];
    }
    
    case 'binary': {
      if (column.distribution === 'biased') {
        const r = rand();
        return r < 0.65 ? 0 : 1;
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
      return null;
  }
}

function create(schema, size) {
  const data = [];
  const seed = 42;
  
  for (let i = 0; i < size; i++) {
    const row = {};
    
    for (const column of schema.columns) {
      if (column.name === 'id' || column.name === 'customer_id' || column.name === 'loan_id' || 
          column.name === 'student_id' || column.name === 'customerID') {
        row[column.name] = generateValue(column, i, seed + i, null);
      } else {
        row[column.name] = generateValue(column, i, seed + i, null);
      }
    }
    
    data.push(row);
  }
  
  return data;
}

module.exports = { create };
