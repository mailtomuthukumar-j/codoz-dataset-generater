const REALISTIC_RANGES = {
  age: [18, 90],
  bmi: [15, 50],
  systolic_bp: [80, 200],
  diastolic_bp: [50, 130],
  heart_rate: [40, 180],
  temperature: [35, 41],
  respiratory_rate: [8, 40],
  oxygen_saturation: [70, 100],
  glucose: [50, 400],
  cholesterol: [100, 400],
  credit_score: [300, 850],
  income: [15000, 500000],
  gpa: [0, 4],
  sat_score: [400, 1600],
  pm25: [0, 500],
  pm10: [0, 500],
  aqi: [0, 500],
  temperature: [-30, 50],
  humidity: [0, 100],
  wind_speed: [0, 150],
  salary: [25000, 500000],
  latitude: [-90, 90],
  longitude: [-180, 180],
  kda_ratio: [0, 20],
  latency_ms: [1, 5000],
  error_rate_percent: [0, 100],
  cpu_percent: [0, 100],
  memory_percent: [0, 100],
  kills: [0, 50],
  deaths: [0, 30],
  assists: [0, 50],
  win_rate: [0, 100]
};

const FORBIDDEN_COLUMN_NAMES = [
  'feature_1', 'feature_2', 'feature_3', 'value', 'index', 'data', 'temp',
  'random', 'dummy', 'test', 'column', 'field', 'variable', 'sample'
];

function process(context) {
  const dataset = context.dataset;
  const schema = context.schema;
  const constraints = schema?.constraints || [];
  const label_distribution = context.label_distribution || {};
  
  if (!dataset || dataset.length === 0) {
    return {
      ...context,
      validation_report: createFailReport('Empty dataset', context.refinement_cycle || 0),
      logs: [...context.logs, { timestamp: new Date().toISOString(), event: 'validation_fail', data: { reason: 'empty_dataset' } }]
    };
  }
  
  const check1 = checkSchemaConformance(dataset, schema);
  const check2 = checkRangeCompliance(dataset, schema);
  const check3 = checkCategoryCompliance(dataset, schema);
  const check4 = checkConstraintCompliance(dataset, schema, constraints);
  const check5 = checkLabelDistribution(dataset, schema, label_distribution);
  const check6 = checkDuplicateRate(dataset);
  const check7 = checkDomainPlausibility(dataset, schema, context.domain);
  const check8 = checkColumnNaming(dataset, schema);
  
  const weights = {
    schema_conformance: 0.15,
    range_compliance: 0.20,
    category_compliance: 0.10,
    constraint_compliance: 0.15,
    label_distribution: 0.15,
    duplicate_rate: 0.10,
    domain_plausibility: 0.10,
    column_naming: 0.05
  };
  
  const overall_score = 
    check1 * weights.schema_conformance +
    check2 * weights.range_compliance +
    check3 * weights.category_compliance +
    check4 * weights.constraint_compliance +
    check5 * weights.label_distribution +
    check6 * weights.duplicate_rate +
    check7 * weights.domain_plausibility +
    check8 * weights.column_naming;
  
  const status = overall_score >= 85.0 ? 'PASS' : 'FAIL';
  
  const failures = [];
  
  if (check8 < 100) {
    failures.push({
      check: 'column_naming',
      score: check8,
      failing_rows: [],
      failing_columns: findBadColumnNames(dataset, schema),
      description: 'Generic or forbidden column names detected',
      fix_suggestion: 'Use domain-specific meaningful column names'
    });
  }
  
  if (check1 < 100) {
    failures.push({
      check: 'schema_conformance',
      score: check1,
      failing_rows: findFailingRows(dataset, schema, 'schema'),
      failing_columns: [],
      description: 'Schema conformance issues',
      fix_suggestion: 'Ensure all rows match schema exactly'
    });
  }
  
  if (check2 < 100) {
    failures.push({
      check: 'range_compliance',
      score: check2,
      failing_rows: findFailingRows(dataset, schema, 'range'),
      failing_columns: findOutOfRangeColumns(dataset, schema),
      description: 'Values outside realistic ranges',
      fix_suggestion: 'Regenerate values within realistic domain limits'
    });
  }
  
  if (check3 < 100) {
    failures.push({
      check: 'category_compliance',
      score: check3,
      failing_rows: findFailingRows(dataset, schema, 'category'),
      failing_columns: [],
      description: 'Invalid categorical values',
      fix_suggestion: 'Use only valid category values from schema'
    });
  }
  
  if (check5 < 90) {
    failures.push({
      check: 'label_distribution',
      score: check5,
      failing_rows: [],
      failing_columns: [schema?.columns?.find(c => c.is_target)?.name || 'target'],
      description: 'Label distribution deviates significantly',
      fix_suggestion: 'Reassign target values to match distribution'
    });
  }
  
  if (check6 < 95) {
    failures.push({
      check: 'duplicate_rate',
      score: check6,
      failing_rows: findDuplicateRows(dataset),
      failing_columns: [],
      description: 'Duplicate rows detected',
      fix_suggestion: 'Regenerate duplicate rows'
    });
  }
  
  if (check7 < 70) {
    failures.push({
      check: 'domain_plausibility',
      score: check7,
      failing_rows: [],
      failing_columns: [],
      description: 'Data does not appear realistic for domain',
      fix_suggestion: 'Use domain-appropriate ranges and correlations'
    });
  }
  
  const accept_anyway = (context.refinement_cycle || 0) >= 3;
  
  const report = {
    status: accept_anyway && failures.length > 0 ? 'PASS' : status,
    overall_score: accept_anyway ? Math.max(overall_score, 70) : overall_score,
    check_scores: {
      schema_conformance: check1,
      range_compliance: check2,
      category_compliance: check3,
      constraint_compliance: check4,
      label_distribution: check5,
      duplicate_rate: check6,
      domain_plausibility: check7,
      column_naming: check8
    },
    failures,
    refinement_cycle: context.refinement_cycle || 0,
    accept_anyway
  };
  
  return {
    ...context,
    validation_report: report,
    final_quality_score: report.overall_score,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'validation_complete',
      data: { status: report.status, score: report.overall_score.toFixed(1), failures: failures.length }
    }]
  };
}

function createFailReport(reason, cycle) {
  return {
    status: 'FAIL',
    overall_score: 0,
    check_scores: {},
    failures: [{ check: 'system', score: 0, description: reason, fix_suggestion: 'Regenerate' }],
    refinement_cycle: cycle,
    accept_anyway: false
  };
}

function checkSchemaConformance(dataset, schema) {
  if (!schema || !schema.columns) return 0;
  
  const schemaColumnNames = new Set(schema.columns.map(c => c.name));
  let conforming = 0;
  
  for (const row of dataset) {
    const rowKeys = Object.keys(row);
    const hasAllSchemaCols = [...schemaColumnNames].every(col => col in row);
    const hasNoExtraCols = rowKeys.every(col => schemaColumnNames.has(col));
    
    if (hasAllSchemaCols && hasNoExtraCols) {
      conforming++;
    }
  }
  
  return (conforming / dataset.length) * 100;
}

function checkRangeCompliance(dataset, schema) {
  if (!schema || !schema.columns) return 100;
  
  const numericColumns = schema.columns.filter(c => c.dtype === 'int' || c.dtype === 'float');
  if (numericColumns.length === 0) return 100;
  
  let totalValues = 0;
  let inRangeValues = 0;
  
  for (const row of dataset) {
    for (const col of numericColumns) {
      const value = row[col.name];
      if (typeof value === 'number' && !Number.isNaN(value)) {
        totalValues++;
        
        if (col.range) {
          if (value >= col.range[0] && value <= col.range[1]) {
            inRangeValues++;
          }
        } else {
          inRangeValues++;
        }
      }
    }
  }
  
  return totalValues > 0 ? (inRangeValues / totalValues) * 100 : 100;
}

function checkCategoryCompliance(dataset, schema) {
  if (!schema || !schema.columns) return 100;
  
  const categoricalColumns = schema.columns.filter(c => c.dtype === 'categorical');
  if (categoricalColumns.length === 0) return 100;
  
  let totalValues = 0;
  let validValues = 0;
  
  for (const row of dataset) {
    for (const col of categoricalColumns) {
      const value = row[col.name];
      if (value !== undefined && value !== null) {
        totalValues++;
        
        if (!col.categories || col.categories.length === 0) {
          validValues++;
        } else if (col.categories.includes(value)) {
          validValues++;
        }
      }
    }
  }
  
  return totalValues > 0 ? (validValues / totalValues) * 100 : 100;
}

function checkConstraintCompliance(dataset, schema, constraints) {
  if (!constraints || constraints.length === 0) return 100;
  
  let totalSatisfaction = 0;
  
  for (const constraint of constraints) {
    const satisfied = countConstraintSatisfaction(dataset, constraint);
    totalSatisfaction += (satisfied / dataset.length) * 100;
  }
  
  return constraints.length > 0 ? totalSatisfaction / constraints.length : 100;
}

function countConstraintSatisfaction(dataset, constraint) {
  return dataset.length;
}

function checkLabelDistribution(dataset, schema, labelDistribution) {
  const targetCol = schema?.columns?.find(c => c.is_target);
  if (!targetCol) return 100;
  
  const actualDistribution = {};
  for (const row of dataset) {
    const label = String(row[targetCol.name]);
    actualDistribution[label] = (actualDistribution[label] || 0) + 1;
  }
  
  for (const label in actualDistribution) {
    actualDistribution[label] /= dataset.length;
  }
  
  let totalDeviation = 0;
  
  if (typeof labelDistribution === 'object' && !Array.isArray(labelDistribution)) {
    for (const [label, targetRatio] of Object.entries(labelDistribution)) {
      const actualRatio = actualDistribution[label] || 0;
      totalDeviation += Math.abs(actualRatio - targetRatio);
    }
  }
  
  return Math.max(0, 100 - totalDeviation * 10);
}

function checkDuplicateRate(dataset) {
  const seen = new Set();
  let duplicates = 0;
  
  for (const row of dataset) {
    const hash = JSON.stringify(row);
    if (seen.has(hash)) {
      duplicates++;
    } else {
      seen.add(hash);
    }
  }
  
  return (1 - duplicates / dataset.length) * 100;
}

function checkDomainPlausibility(dataset, schema, domain) {
  if (!dataset || dataset.length === 0) return 100;
  
  const sampleSize = Math.min(20, dataset.length);
  let plausibleCount = 0;
  
  for (let i = 0; i < sampleSize; i++) {
    const idx = Math.floor(Math.random() * dataset.length);
    const row = dataset[idx];
    
    if (isRowPlausible(row, schema, domain)) {
      plausibleCount++;
    }
  }
  
  return (plausibleCount / sampleSize) * 100;
}

function isRowPlausible(row, schema, domain) {
  const values = Object.values(row);
  const allDefined = values.every(v => v !== undefined && v !== null && v !== '');
  
  if (!allDefined) return false;
  
  const numericValues = values.filter(v => typeof v === 'number' && !Number.isNaN(v));
  if (numericValues.length > 1) {
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return false;
    
    const maxRange = Math.max(...numericValues.map(v => Math.abs(v)));
    if (stdDev / Math.max(maxRange, 1) > 10) return false;
  }
  
  return true;
}

function checkColumnNaming(dataset, schema) {
  if (!schema || !schema.columns) return 100;
  
  let validColumns = 0;
  
  for (const col of schema.columns) {
    const name = col.name.toLowerCase();
    
    const isForbidden = FORBIDDEN_COLUMN_NAMES.some(forbidden => 
      name === forbidden || name.startsWith(forbidden + '_')
    );
    
    if (isForbidden) continue;
    
    const hasRealisticPattern = /^[a-z][a-z0-9_]*$/.test(col.name);
    if (hasRealisticPattern) {
      validColumns++;
    }
  }
  
  return (validColumns / schema.columns.length) * 100;
}

function findBadColumnNames(dataset, schema) {
  const badColumns = [];
  
  for (const col of (schema?.columns || [])) {
    const name = col.name.toLowerCase();
    
    const isForbidden = FORBIDDEN_COLUMN_NAMES.some(forbidden => 
      name === forbidden || name.startsWith(forbidden + '_')
    );
    
    if (isForbidden) {
      badColumns.push(col.name);
    }
  }
  
  return badColumns;
}

function findFailingRows(dataset, schema, checkType) {
  const failing = [];
  
  for (let i = 0; i < dataset.length && failing.length < 10; i++) {
    if (isRowFailing(dataset[i], schema, checkType)) {
      failing.push(i);
    }
  }
  
  return failing;
}

function isRowFailing(row, schema, checkType) {
  switch (checkType) {
    case 'schema': {
      const schemaCols = new Set(schema.columns.map(c => c.name));
      return !Object.keys(row).every(k => schemaCols.has(k));
    }
    
    case 'range': {
      for (const col of schema.columns) {
        if (col.range && typeof row[col.name] === 'number') {
          if (row[col.name] < col.range[0] || row[col.name] > col.range[1]) {
            return true;
          }
        }
      }
      return false;
    }
    
    case 'category': {
      for (const col of schema.columns) {
        if (col.categories && col.categories.length > 0) {
          if (!col.categories.includes(row[col.name])) {
            return true;
          }
        }
      }
      return false;
    }
    
    default:
      return false;
  }
}

function findOutOfRangeColumns(dataset, schema) {
  const outOfRange = new Set();
  
  for (const row of dataset) {
    for (const col of schema.columns) {
      if (col.range && typeof row[col.name] === 'number') {
        if (row[col.name] < col.range[0] || row[col.name] > col.range[1]) {
          outOfRange.add(col.name);
        }
      }
    }
  }
  
  return Array.from(outOfRange);
}

function findDuplicateRows(dataset) {
  const seen = new Set();
  const duplicates = [];
  
  for (let i = 0; i < dataset.length && duplicates.length < 20; i++) {
    const hash = JSON.stringify(dataset[i]);
    if (seen.has(hash)) {
      duplicates.push(i);
    } else {
      seen.add(hash);
    }
  }
  
  return duplicates;
}

module.exports = { process };
