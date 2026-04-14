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

const CORRELATION_RULES = {
  medical: {
    diabetic: {
      glucose: { bias: 60, range_shift: 0.15 },
      hba1c: { bias: 2.0, range_shift: 0.15 },
      bmi: { bias: 4, range_shift: 0.12 },
      blood_pressure_systolic: { bias: 15, range_shift: 0.1 },
      cholesterol: { bias: 25, range_shift: 0.12 }
    },
    positive: {
      glucose: { bias: 60, range_shift: 0.15 },
      hba1c: { bias: 2.0, range_shift: 0.15 },
      bmi: { bias: 4, range_shift: 0.12 },
      blood_pressure_systolic: { bias: 15, range_shift: 0.1 },
      cholesterol: { bias: 25, range_shift: 0.12 }
    },
    healthy: {
      glucose: { bias: -25, range_shift: 0.12 },
      hba1c: { bias: -0.8, range_shift: 0.1 },
      bmi: { bias: -2, range_shift: 0.1 },
      blood_pressure_systolic: { bias: -8, range_shift: 0.1 },
      cholesterol: { bias: -15, range_shift: 0.1 }
    },
    negative: {
      glucose: { bias: -25, range_shift: 0.12 },
      hba1c: { bias: -0.8, range_shift: 0.1 },
      bmi: { bias: -2, range_shift: 0.1 },
      blood_pressure_systolic: { bias: -8, range_shift: 0.1 },
      cholesterol: { bias: -15, range_shift: 0.1 }
    },
    pre_diabetic: {
      glucose: { bias: 15, range_shift: 0.12 },
      hba1c: { bias: 0.5, range_shift: 0.1 },
      bmi: { bias: 1, range_shift: 0.1 }
    }
  },
  financial: {
    approved: {
      credit_score: { bias: 100, range_shift: 0.15 },
      income: { bias: 30000, range_shift: 0.12 }
    },
    default: {
      credit_score: { bias: -80, range_shift: 0.12 },
      income: { bias: -20000, range_shift: 0.1 }
    }
  }
};

const INTER_COLUMN_CORRELATIONS = [
  { source: 'glucose', target: 'hba1c', correlation: 0.6, threshold: 140, direction: 'above' },
  { source: 'bmi', target: 'blood_pressure_systolic', correlation: 0.45, threshold: 28, direction: 'above' },
  { source: 'credit_score', target: 'income', correlation: 0.55, threshold: 600, direction: 'above' },
  { source: 'kills', target: 'kills_deaths_ratio', correlation: 0.75, threshold: 12, direction: 'above' },
  { source: 'deaths', target: 'win_rate', correlation: -0.55, threshold: 10, direction: 'above' },
  { source: 'pm25', target: 'aqi', correlation: 0.80, threshold: 50, direction: 'above' }
];

function process(context) {
  const schema = context.schema;
  const rules = context.rules || {};
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
  
  const generationOrder = rules.generation_order || schema.columns.map(c => c.name);
  
  for (let i = 0; i < size; i++) {
    let row = null;
    let attempts = 0;
    
    while (attempts < 10) {
      const candidateRow = generateRow(schema.columns, constraints, i, seed, targetColumn, targetValues, targetDistribution[i], domain, generationOrder, rules);
      
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
      row = generateRow(schema.columns, constraints, i, seed, targetColumn, targetValues, targetDistribution[i], domain, generationOrder, rules);
    }
    
    dataset.push(row);
  }
  
  return {
    ...context,
    dataset,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'generation_complete',
      data: { 
        row_count: dataset.length, 
        unique_ids: idSet.size, 
        correlation_enforced: true,
        causal_order_used: generationOrder.length > 0
      }
    }]
  };
}

function generateRow(columns, constraints, index, baseSeed, targetColumn, targetValues, targetValue, domain, generationOrder, rules) {
  const row = {};
  const seed = baseSeed + index * 1000 + (Date.now() % 1000);
  
  const columnMap = new Map(columns.map(c => [c.name, c]));
  
  const orderedColumnNames = generationOrder.filter(name => columnMap.has(name));
  for (const col of columns) {
    if (!orderedColumnNames.includes(col.name)) {
      orderedColumnNames.push(col.name);
    }
  }
  
  for (const colName of orderedColumnNames) {
    const col = columnMap.get(colName);
    if (!col) continue;
    
    if (col.is_target) {
      row[col.name] = targetValue;
    } else if (col.dtype === 'uuid') {
      row[col.name] = generateUUIDv4();
    } else {
      const correlationContext = buildCorrelationContext(row, targetValue, domain, targetColumn?.name, rules);
      row[col.name] = generateValue(col, seed, row, targetValue, targetColumn, domain, correlationContext);
    }
  }
  
  if (rules.deterministic && rules.deterministic.length > 0) {
    const { applyDeterministicRules } = require('./logic_rules_agent');
    return applyDeterministicRules(row, rules.deterministic, columns);
  }
  
  return row;
}

function buildCorrelationContext(row, targetValue, domain, targetName, rules) {
  const context = {
    targetValue,
    domain,
    targetName,
    correlatedValues: {},
    correlations: rules?.correlations || [],
    deterministicRules: rules?.deterministic || []
  };
  
  for (const colName of Object.keys(row)) {
    context.correlatedValues[colName] = row[colName];
  }
  
  return context;
}

function generateValue(column, seed, rowContext, targetValue, targetColumn, domain, correlationContext) {
  const rand = () => seededRandom(seed + Date.now() % 1000 + column.name.length);
  const normRand = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
  
  const [min, max] = column.range || [0, 100];
  const [adjMin, adjMax, meanShift] = applyCorrelationAdjustment(
    column.name, min, max, targetValue, targetColumn, domain, rowContext, correlationContext
  );
  
  const baseMean = (adjMin + adjMax) / 2;
  const baseStd = (adjMax - adjMin) / 6;
  const adjustedMean = baseMean + meanShift;
  const adjustedStd = baseStd;
  
  switch (column.dtype) {
    case 'int': {
      const value = Math.round(Math.max(adjMin, Math.min(adjMax, adjustedMean + normRand() * adjustedStd)));
      return value;
    }
    
    case 'float': {
      let value = adjustedMean + normRand() * adjustedStd;
      value = Math.max(adjMin, Math.min(adjMax, value));
      return parseFloat(value.toFixed(2));
    }
    
    case 'categorical': {
      const adjustedCategories = applyCategoricalCorrelation(
        column.categories || ['A', 'B', 'C'],
        column.name, targetValue, targetColumn, domain, rowContext
      );
      return adjustedCategories[Math.floor(rand() * adjustedCategories.length)];
    }
    
    case 'boolean':
      return applyBooleanCorrelation(column.name, targetValue, domain, rowContext);
    
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
        return Math.round(adjMin + rand() * (adjMax - adjMin));
      }
      return parseFloat((adjMin + rand() * (adjMax - adjMin)).toFixed(2));
    }
  }
}

function applyCorrelationAdjustment(colName, min, max, targetValue, targetColumn, domain, rowContext, correlationContext) {
  let adjMin = min;
  let adjMax = max;
  let meanShift = 0;
  
  const domainRules = CORRELATION_RULES[domain];
  if (domainRules) {
    const targetKey = String(targetValue).toLowerCase();
    const targetRules = domainRules[targetKey];
    
    if (targetRules && targetRules[colName]) {
      const rule = targetRules[colName];
      meanShift = rule.bias;
      const shiftAmount = (max - min) * rule.range_shift * 0.5;
      adjMin = min + shiftAmount;
      adjMax = max - shiftAmount;
    }
  }
  
  for (const corr of INTER_COLUMN_CORRELATIONS) {
    if (corr.target === colName && rowContext[corr.source] !== undefined) {
      const sourceValue = rowContext[corr.source];
      const threshold = corr.threshold;
      let correlationBoost = 0;
      
      if (corr.direction === 'above' && sourceValue > threshold) {
        const excess = sourceValue - threshold;
        correlationBoost = excess * corr.correlation * 0.05;
      } else if (corr.direction === 'below' && sourceValue < threshold) {
        const deficit = threshold - sourceValue;
        correlationBoost = -deficit * Math.abs(corr.correlation) * 0.05;
      }
      
      meanShift += correlationBoost;
    }
  }
  
  return [adjMin, adjMax, meanShift];
}

function applyCategoricalCorrelation(categories, colName, targetValue, targetColumn, domain, rowContext) {
  if (!targetValue || !targetColumn) return categories;
  
  const medicalOverrides = {
    activity_level: {
      diabetic: ['sedentary', 'light', 'moderate'],
      healthy: ['moderate', 'active', 'very_active'],
      pre_diabetic: ['light', 'moderate', 'active']
    }
  };
  
  if (domain === 'medical' && medicalOverrides[colName]) {
    const targetKey = String(targetValue).toLowerCase();
    if (medicalOverrides[colName][targetKey]) {
      return medicalOverrides[colName][targetKey];
    }
  }
  
  return categories;
}

function applyBooleanCorrelation(colName, targetValue, domain, rowContext) {
  const domainSpecificLogic = {
    medical: {
      smoking_history: { diabetic: 0.7, healthy: 0.3, pre_diabetic: 0.5 },
      hypertension: { diabetic: 0.6, healthy: 0.2, pre_diabetic: 0.4 }
    },
    financial: {
      has_existing_loans: { approved: 0.3, default: 0.7 }
    }
  };
  
  if (domainSpecificLogic[domain]?.[colName]) {
    const targetKey = String(targetValue).toLowerCase();
    const probabilities = domainSpecificLogic[domain][colName];
    if (probabilities[targetKey] !== undefined) {
      return Math.random() < probabilities[targetKey];
    }
  }
  
  return Math.random() > 0.5;
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
