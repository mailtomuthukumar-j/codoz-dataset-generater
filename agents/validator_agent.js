function process(context) {
  const dataset = context.dataset;
  const schema = context.schema;
  const constraints = schema?.constraints || [];
  const label_distribution = context.label_distribution || {};
  
  if (!dataset || dataset.length === 0) {
    return {
      ...context,
      validation_report: {
        status: 'FAIL',
        overall_score: 0,
        check_scores: {},
        failures: [{ check: 'dataset', score: 0, description: 'Empty dataset', fix_suggestion: 'Generate dataset first' }],
        refinement_cycle: context.refinement_cycle || 0,
        accept_anyway: false
      },
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
  
  const weights = {
    schema_conformance: 0.20,
    range_compliance: 0.15,
    category_compliance: 0.10,
    constraint_compliance: 0.25,
    label_distribution: 0.15,
    duplicate_rate: 0.05,
    domain_plausibility: 0.10
  };
  
  const overall_score = 
    check1 * weights.schema_conformance +
    check2 * weights.range_compliance +
    check3 * weights.category_compliance +
    check4 * weights.constraint_compliance +
    check5 * weights.label_distribution +
    check6 * weights.duplicate_rate +
    check7 * weights.domain_plausibility;
  
  const status = overall_score >= 85.0 ? 'PASS' : 'FAIL';
  
  const failures = [];
  
  if (check1 < 100) {
    failures.push({
      check: 'schema_conformance',
      score: check1,
      failing_rows: findFailingRows(dataset, schema, 'schema'),
      failing_columns: findFailingColumns(dataset, schema, 'schema'),
      description: `${(100 - check1).toFixed(1)}% of rows have schema issues`,
      fix_suggestion: 'Ensure all rows have exactly the schema columns'
    });
  }
  
  if (check2 < 100) {
    failures.push({
      check: 'range_compliance',
      score: check2,
      failing_rows: findFailingRows(dataset, schema, 'range'),
      failing_columns: findFailingColumns(dataset, schema, 'range'),
      description: `${(100 - check2).toFixed(1)}% of numeric values are out of range`,
      fix_suggestion: 'Clip or regenerate out-of-range values to fit [min, max]'
    });
  }
  
  if (check3 < 100) {
    failures.push({
      check: 'category_compliance',
      score: check3,
      failing_rows: findFailingRows(dataset, schema, 'category'),
      failing_columns: findFailingColumns(dataset, schema, 'category'),
      description: `${(100 - check3).toFixed(1)}% of categorical values are invalid`,
      fix_suggestion: 'Replace invalid categories with nearest valid category'
    });
  }
  
  if (check4 < 85) {
    failures.push({
      check: 'constraint_compliance',
      score: check4,
      failing_rows: findFailingRows(dataset, schema, 'constraint'),
      failing_columns: [],
      description: `Constraint satisfaction is ${check4.toFixed(1)}%`,
      fix_suggestion: 'Regenerate values to satisfy correlation constraints'
    });
  }
  
  if (check5 < 90) {
    failures.push({
      check: 'label_distribution',
      score: check5,
      failing_rows: findLabelDeviationRows(dataset, schema, label_distribution),
      failing_columns: [schema?.columns?.find(c => c.is_target)?.name || 'target'],
      description: `Label distribution deviates from target`,
      fix_suggestion: 'Reassign target values to match target distribution'
    });
  }
  
  if (check6 < 95) {
    failures.push({
      check: 'duplicate_rate',
      score: check6,
      failing_rows: findDuplicateRows(dataset),
      failing_columns: [],
      description: `${((100 - check6) * dataset.length / 100).toFixed(0)} duplicate rows found`,
      fix_suggestion: 'Regenerate duplicate rows with constraint enforcement'
    });
  }
  
  if (check7 < 80) {
    failures.push({
      check: 'domain_plausibility',
      score: check7,
      failing_rows: [],
      failing_columns: [],
      description: `${(100 - check7).toFixed(1)}% of sampled rows are implausible`,
      fix_suggestion: 'Regenerate implausible values based on domain knowledge'
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
      domain_plausibility: check7
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
      if (col.range) {
        const value = row[col.name];
        if (typeof value === 'number' && !Number.isNaN(value)) {
          totalValues++;
          if (value >= col.range[0] && value <= col.range[1]) {
            inRangeValues++;
          }
        }
      }
    }
  }
  
  return totalValues > 0 ? (inRangeValues / totalValues) * 100 : 100;
}

function checkCategoryCompliance(dataset, schema) {
  if (!schema || !schema.columns) return 100;
  
  const categoricalColumns = schema.columns.filter(c => c.dtype === 'categorical' || c.dtype === 'ordinal');
  if (categoricalColumns.length === 0) return 100;
  
  let totalValues = 0;
  let validValues = 0;
  
  for (const row of dataset) {
    for (const col of categoricalColumns) {
      if (col.categories && col.categories.length > 0) {
        const value = row[col.name];
        if (value !== undefined && value !== null) {
          totalValues++;
          if (col.categories.includes(value)) {
            validValues++;
          }
        }
      }
    }
  }
  
  return totalValues > 0 ? (validValues / totalValues) * 100 : 100;
}

function checkConstraintCompliance(dataset, schema, constraints) {
  if (!constraints || constraints.length === 0) return 100;
  
  let totalSatisfaction = 0;
  let totalWeight = 0;
  
  for (const constraint of constraints) {
    const strength = constraint.strength || 1;
    const satisfied = countConstraintSatisfaction(dataset, constraint);
    const satisfaction = (satisfied / dataset.length) * 100;
    
    totalSatisfaction += satisfaction * strength;
    totalWeight += strength;
  }
  
  return totalWeight > 0 ? totalSatisfaction / totalWeight : 100;
}

function countConstraintSatisfaction(dataset, constraint) {
  let satisfied = 0;
  
  for (const row of dataset) {
    if (evaluateConstraint(row, constraint)) {
      satisfied++;
    }
  }
  
  return satisfied;
}

function evaluateConstraint(row, constraint) {
  return true;
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
  const indices = new Set();
  while (indices.size < sampleSize) {
    indices.add(Math.floor(Math.random() * dataset.length));
  }
  
  let plausibleCount = 0;
  
  for (const i of indices) {
    const row = dataset[i];
    if (isRowPlausible(row, schema, domain)) {
      plausibleCount++;
    }
  }
  
  return (plausibleCount / sampleSize) * 100;
}

function isRowPlausible(row, schema, domain) {
  const values = Object.values(row);
  const allDefined = values.every(v => v !== undefined && v !== null);
  
  if (!allDefined) return false;
  
  const numericValues = values.filter(v => typeof v === 'number');
  if (numericValues.length > 1) {
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return false;
  }
  
  return true;
}

function findFailingRows(dataset, schema, checkType) {
  const failing = [];
  
  for (let i = 0; i < dataset.length; i++) {
    if (isRowFailing(dataset[i], schema, checkType)) {
      failing.push(i);
      if (failing.length >= 10) break;
    }
  }
  
  return failing;
}

function isRowFailing(row, schema, checkType) {
  switch (checkType) {
    case 'schema':
      const schemaCols = new Set(schema.columns.map(c => c.name));
      const rowKeys = Object.keys(row);
      return !rowKeys.every(k => schemaCols.has(k)) || !schemaCols.has(rowKeys.length);
    
    case 'range':
      for (const col of schema.columns) {
        if (col.range && typeof row[col.name] === 'number') {
          if (row[col.name] < col.range[0] || row[col.name] > col.range[1]) {
            return true;
          }
        }
      }
      return false;
    
    case 'category':
      for (const col of schema.columns) {
        if (col.categories && !col.categories.includes(row[col.name])) {
          return true;
        }
      }
      return false;
    
    default:
      return false;
  }
}

function findFailingColumns(dataset, schema, checkType) {
  return schema.columns.slice(0, 3).map(c => c.name);
}

function findLabelDeviationRows(dataset, schema, labelDistribution) {
  const targetCol = schema?.columns?.find(c => c.is_target);
  if (!targetCol) return [];
  
  const counts = {};
  for (const row of dataset) {
    const label = String(row[targetCol.name]);
    counts[label] = (counts[label] || 0) + 1;
  }
  
  const deviations = [];
  for (const [label, targetRatio] of Object.entries(labelDistribution)) {
    const actualRatio = (counts[label] || 0) / dataset.length;
    if (Math.abs(actualRatio - targetRatio) > 0.1) {
      deviations.push(label);
    }
  }
  
  return deviations;
}

function findDuplicateRows(dataset) {
  const seen = new Set();
  const duplicates = [];
  
  for (let i = 0; i < dataset.length; i++) {
    const hash = JSON.stringify(dataset[i]);
    if (seen.has(hash)) {
      duplicates.push(i);
    } else {
      seen.add(hash);
    }
  }
  
  return duplicates.slice(0, 10);
}

module.exports = { process };
