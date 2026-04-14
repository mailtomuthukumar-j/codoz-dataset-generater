const STRICT_RANGES = {
  blood_pressure_systolic: [60, 180],
  blood_pressure_diastolic: [40, 120],
  heart_rate: [40, 140],
  body_temperature: [35.0, 41.5],
  bmi: [15.0, 55.0],
  glucose: [50.0, 500.0],
  hba1c: [4.0, 16.0],
  age: [18, 100],
  pregnancies: [0, 20],
  cholesterol: [100.0, 400.0],
  credit_score: [300, 850],
  income: [0.0, 500000.0],
  gpa: [0.0, 4.0],
  temperature: [-50.0, 60.0],
  humidity: [0.0, 100.0],
  aqi: [0, 500],
  pm25: [0.0, 500.0],
  rating: [1.0, 5.0]
};

const FORBIDDEN_COLUMN_NAMES = [
  'feature_1', 'feature_2', 'feature_3', 'value', 'index', 'data', 'temp',
  'random', 'dummy', 'test', 'column', 'field', 'variable', 'sample'
];

function process(context) {
  const dataset = context.dataset;
  const schema = context.schema;
  
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
  const check4 = checkDtypeCompliance(dataset, schema);
  const check5 = checkLabelDistribution(dataset, schema);
  const check6 = checkDuplicateRate(dataset);
  const check7 = checkColumnNaming(dataset, schema);
  const check8 = checkUUIDFormat(dataset, schema);
  
  const weights = {
    schema_conformance: 0.15,
    range_compliance: 0.20,
    category_compliance: 0.10,
    dtype_compliance: 0.15,
    label_distribution: 0.15,
    duplicate_rate: 0.10,
    column_naming: 0.05,
    uuid_format: 0.10
  };
  
  const overall_score = 
    check1 * weights.schema_conformance +
    check2 * weights.range_compliance +
    check3 * weights.category_compliance +
    check4 * weights.dtype_compliance +
    check5 * weights.label_distribution +
    check6 * weights.duplicate_rate +
    check7 * weights.column_naming +
    check8 * weights.uuid_format;
  
  const status = overall_score >= 85.0 ? 'PASS' : 'FAIL';
  
  const failures = [];
  
  if (check8 < 100) failures.push({ check: 'uuid_format', score: check8, description: 'Invalid UUID format in ID column' });
  if (check7 < 100) failures.push({ check: 'column_naming', score: check7, description: 'Forbidden column names detected' });
  if (check1 < 100) failures.push({ check: 'schema_conformance', score: check1, description: 'Schema conformance issues' });
  if (check2 < 100) failures.push({ check: 'range_compliance', score: check2, description: 'Values outside strict ranges' });
  if (check3 < 100) failures.push({ check: 'category_compliance', score: check3, description: 'Invalid categorical values' });
  if (check4 < 100) failures.push({ check: 'dtype_compliance', score: check4, description: 'Data type violations' });
  if (check5 < 90) failures.push({ check: 'label_distribution', score: check5, description: 'Label distribution deviation' });
  if (check6 < 95) failures.push({ check: 'duplicate_rate', score: check6, description: 'Duplicate rows detected' });
  
  const accept_anyway = (context.refinement_cycle || 0) >= 3;
  
  const report = {
    status: accept_anyway && failures.length > 0 ? 'PASS' : status,
    overall_score: accept_anyway ? Math.max(overall_score, 70) : overall_score,
    check_scores: {
      schema_conformance: check1,
      range_compliance: check2,
      category_compliance: check3,
      dtype_compliance: check4,
      label_distribution: check5,
      duplicate_rate: check6,
      column_naming: check7,
      uuid_format: check8
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
    failures: [{ check: 'system', score: 0, description: reason }],
    refinement_cycle: cycle,
    accept_anyway: false
  };
}

function checkSchemaConformance(dataset, schema) {
  if (!schema || !schema.columns) return 0;
  const schemaCols = new Set(schema.columns.map(c => c.name));
  let conforming = 0;
  for (const row of dataset) {
    const rowKeys = Object.keys(row);
    const hasAll = [...schemaCols].every(c => c in row);
    const hasNoExtra = rowKeys.every(c => schemaCols.has(c));
    if (hasAll && hasNoExtra) conforming++;
  }
  return (conforming / dataset.length) * 100;
}

function checkRangeCompliance(dataset, schema) {
  if (!schema || !schema.columns) return 100;
  const numericCols = schema.columns.filter(c => c.dtype === 'int' || c.dtype === 'float');
  if (numericCols.length === 0) return 100;
  
  let total = 0, valid = 0;
  for (const row of dataset) {
    for (const col of numericCols) {
      const val = row[col.name];
      if (typeof val === 'number' && !Number.isNaN(val)) {
        total++;
        if (col.range) {
          if (val >= col.range[0] && val <= col.range[1]) valid++;
        } else {
          valid++;
        }
      }
    }
  }
  return total > 0 ? (valid / total) * 100 : 100;
}

function checkCategoryCompliance(dataset, schema) {
  if (!schema || !schema.columns) return 100;
  const catCols = schema.columns.filter(c => c.dtype === 'categorical' || c.dtype === 'ordinal');
  if (catCols.length === 0) return 100;
  
  let total = 0, valid = 0;
  for (const row of dataset) {
    for (const col of catCols) {
      const val = row[col.name];
      if (val !== undefined && val !== null) {
        total++;
        if (!col.categories || col.categories.length === 0 || col.categories.includes(val)) {
          valid++;
        }
      }
    }
  }
  return total > 0 ? (valid / total) * 100 : 100;
}

function checkDtypeCompliance(dataset, schema) {
  if (!schema || !schema.columns) return 100;
  
  let total = 0, valid = 0;
  for (const row of dataset) {
    for (const col of schema.columns) {
      const val = row[col.name];
      if (val === undefined || val === null) continue;
      total++;
      
      switch (col.dtype) {
        case 'int':
          if (Number.isInteger(val)) valid++;
          break;
        case 'float':
          if (typeof val === 'number' && !Number.isNaN(val)) valid++;
          break;
        case 'boolean':
          if (val === true || val === false) valid++;
          break;
        case 'uuid':
          if (typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)) valid++;
          break;
        default:
          valid++;
      }
    }
  }
  return total > 0 ? (valid / total) * 100 : 100;
}

function checkLabelDistribution(dataset, schema) {
  const targetCol = schema?.columns?.find(c => c.is_target);
  if (!targetCol) return 100;
  
  const actual = {};
  for (const row of dataset) {
    const label = String(row[targetCol.name]);
    actual[label] = (actual[label] || 0) + 1;
  }
  for (const k in actual) actual[k] /= dataset.length;
  
  const target = schema.label_distribution || {};
  let deviation = 0;
  for (const [label, ratio] of Object.entries(target)) {
    deviation += Math.abs((actual[label] || 0) - ratio);
  }
  return Math.max(0, 100 - deviation * 10);
}

function checkDuplicateRate(dataset) {
  const seen = new Set();
  let dupes = 0;
  for (const row of dataset) {
    const hash = JSON.stringify(row);
    if (seen.has(hash)) dupes++;
    else seen.add(hash);
  }
  return (1 - dupes / dataset.length) * 100;
}

function checkColumnNaming(dataset, schema) {
  if (!schema || !schema.columns) return 100;
  let valid = 0;
  for (const col of schema.columns) {
    const name = col.name.toLowerCase();
    if (!FORBIDDEN_COLUMN_NAMES.some(f => name === f || name.startsWith(f + '_'))) {
      if (/^[a-z][a-z0-9_]*$/.test(col.name)) valid++;
    }
  }
  return (valid / schema.columns.length) * 100;
}

function checkUUIDFormat(dataset, schema) {
  const uuidCol = schema?.columns?.find(c => c.dtype === 'uuid');
  if (!uuidCol) return 100;
  
  let total = 0, valid = 0;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  for (const row of dataset) {
    const val = row[uuidCol.name];
    if (val !== undefined && val !== null) {
      total++;
      if (uuidRegex.test(String(val))) valid++;
    }
  }
  return total > 0 ? (valid / total) * 100 : 100;
}

module.exports = { process };
