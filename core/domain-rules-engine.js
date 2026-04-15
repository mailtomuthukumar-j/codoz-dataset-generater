/**
 * CODOZ Domain Rules Engine
 * Generates logically consistent rows using domain blueprints
 * Every label is derived from features using explicit rules
 */

function generateDomainRow(blueprint, index, maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const row = generateRowAttempt(blueprint, index);
    const validation = validateRow(blueprint, row);
    
    if (validation.valid) {
      return row;
    }
  }
  
  return generateFallbackRow(blueprint, index);
}

function generateRowAttempt(blueprint, index) {
  const row = {};
  const idField = blueprint.idField;
  const targetField = blueprint.target;
  
  row[idField] = generateUUID();
  
  const featureValues = {};
  
  const orderedColumns = orderColumnsByDependency(blueprint.columns, blueprint);
  
  for (const col of orderedColumns) {
    if (col === targetField || col === idField) continue;
    
    const constraint = blueprint.featureConstraints[col];
    if (!constraint) continue;
    
    featureValues[col] = generateFeatureValue(col, constraint, featureValues);
  }
  
  Object.assign(row, featureValues);
  
  const { label, derivation } = deriveLabel(blueprint, row, featureValues);
  row[targetField] = label;
  row._derivation = derivation;
  
  return row;
}

function orderColumnsByDependency(columns, blueprint) {
  const priorityCols = ['gender', 'age'];
  const ordered = [];
  const rest = [];
  
  for (const col of columns) {
    if (priorityCols.includes(col)) {
      ordered.push(col);
    } else {
      rest.push(col);
    }
  }
  
  return [...ordered, ...rest];
}

function generateFallbackRow(blueprint, index) {
  const row = {};
  const idField = blueprint.idField;
  const targetField = blueprint.target;
  
  row[idField] = generateUUID();
  
  const featureValues = {};
  
  for (const col of blueprint.columns) {
    if (col === targetField || col === idField) continue;
    
    const constraint = blueprint.featureConstraints[col];
    if (!constraint) continue;
    
    featureValues[col] = generateSafeValue(col, constraint);
  }
  
  if (featureValues.gender === 'Male' && featureValues.pregnancy_count > 2) {
    featureValues.pregnancy_count = Math.floor(Math.random() * 3);
  }
  
  Object.assign(row, featureValues);
  
  row[targetField] = blueprint.targetClasses[0];
  row._derivation = 'Generated with safe defaults';
  
  return row;
}

function generateFeatureValue(colName, constraint, existingValues) {
  if (constraint.type === 'categorical') {
    return generateCategoricalValue(colName, constraint.values, existingValues);
  }
  
  if (constraint.type === 'integer') {
    let min = constraint.min;
    let max = constraint.max;
    
    if (constraint.derived && existingValues.age) {
      const derivedRange = constraint.derived(existingValues.age);
      min = derivedRange.min;
      max = derivedRange.max;
    }
    
    return Math.floor(min + Math.random() * (max - min + 1));
  }
  
  if (constraint.type === 'float') {
    const min = constraint.min;
    const max = constraint.max;
    const value = min + Math.random() * (max - min);
    return parseFloat(value.toFixed(2));
  }
  
  return null;
}

function generateCategoricalValue(colName, values, existingValues) {
  if (colName === 'gender') {
    return randomChoice(['Male', 'Female']);
  }
  
  if (colName === 'pregnancy_count' && existingValues.gender) {
    if (existingValues.gender === 'Male') {
      return Math.floor(Math.random() * 3);
    } else {
      return Math.floor(Math.random() * 10) + 1;
    }
  }
  
  return randomChoice(values);
}

function generateSafeValue(colName, constraint) {
  if (constraint.type === 'categorical') {
    return constraint.values[0];
  }
  
  if (constraint.type === 'integer') {
    const mid = Math.floor((constraint.min + constraint.max) / 2);
    return mid;
  }
  
  if (constraint.type === 'float') {
    const mid = (constraint.min + constraint.max) / 2;
    return parseFloat(mid.toFixed(2));
  }
  
  return null;
}

function deriveLabel(blueprint, row, featureValues) {
  const targetField = blueprint.target;
  const labelRules = blueprint.labelRules || [];
  
  let bestMatch = null;
  let bestWeight = 0;
  
  for (const rule of labelRules) {
    const matches = rule.indicators.filter(indicator => {
      return evaluateIndicator(indicator, row, featureValues);
    });
    
    const matchRatio = matches.length / rule.indicators.length;
    const score = matchRatio * rule.weight;
    
    if (score > bestWeight) {
      bestWeight = score;
      bestMatch = rule;
    }
  }
  
  if (bestMatch) {
    const derivation = bestMatch.indicators
      .filter(ind => evaluateIndicator(ind, row, featureValues))
      .join(' + ');
    
    return {
      label: bestMatch.target,
      derivation: derivation || 'Default rule applied'
    };
  }
  
  return {
    label: blueprint.targetClasses[0],
    derivation: 'No specific rule matched, using default'
  };
}

function evaluateIndicator(indicator, row, featureValues) {
  indicator = indicator.trim();
  
  if (indicator.includes(' IN [')) {
    const match = indicator.match(/(\w+)\s+IN\s+\[([^\]]+)\]/);
    if (match) {
      const field = match[1];
      const values = match[2].split(',').map(v => v.trim());
      return values.includes(String(row[field]));
    }
  }
  
  if (indicator.includes('>=')) {
    const match = indicator.match(/(\w+)\s*([><=!]+)\s*([\d.]+)/);
    if (match) {
      const field = match[1];
      const op = match[2];
      const value = parseFloat(match[3]);
      return compare(row[field], op, value);
    }
  }
  
  if (indicator.includes('>')) {
    const match = indicator.match(/(\w+)\s*>\s*([\d.]+)/);
    if (match) {
      const field = match[1];
      const value = parseFloat(match[2]);
      return row[field] > value;
    }
  }
  
  if (indicator.includes('<')) {
    const match = indicator.match(/(\w+)\s*<\s*([\d.]+)/);
    if (match) {
      const field = match[1];
      const value = parseFloat(match[2]);
      return row[field] < value;
    }
  }
  
  if (indicator.includes('=')) {
    const match = indicator.match(/(\w+)\s*=\s*(.+)/);
    if (match) {
      const field = match[1];
      const value = match[2].trim();
      return String(row[field]) === value;
    }
  }
  
  return false;
}

function compare(a, op, b) {
  switch (op) {
    case '>': return a > b;
    case '>=': return a >= b;
    case '<': return a < b;
    case '<=': return a <= b;
    case '==': return a == b;
    case '!=': return a != b;
    default: return false;
  }
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function validateRow(blueprint, row) {
  const contradictions = blueprint.contradictions || [];
  const violations = [];
  
  for (const rule of contradictions) {
    if (rule.invalid) {
      const result = evaluateIndicator(rule.condition, row, row);
      if (result) {
        violations.push({
          type: 'invalid',
          condition: rule.condition,
          message: `Contradiction detected: ${rule.condition}`
        });
      }
    }
  }
  
  for (const col of blueprint.columns) {
    const constraint = blueprint.featureConstraints[col];
    if (!constraint) continue;
    
    const value = row[col];
    
    if (constraint.min !== undefined && value < constraint.min) {
      violations.push({
        type: 'range',
        column: col,
        value: value,
        min: constraint.min,
        message: `${col}=${value} below minimum ${constraint.min}`
      });
    }
    
    if (constraint.max !== undefined && value > constraint.max) {
      violations.push({
        type: 'range',
        column: col,
        value: value,
        max: constraint.max,
        message: `${col}=${value} above maximum ${constraint.max}`
      });
    }
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

module.exports = {
  generateDomainRow,
  validateRow,
  evaluateIndicator
};
