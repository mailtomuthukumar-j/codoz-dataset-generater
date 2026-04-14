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
  const domain = context.domain || 'other';
  
  if (!dataset || dataset.length === 0) {
    return createFailContext(context, 'Empty dataset');
  }
  
  const test1 = testSchemaMeaning(dataset, schema);
  const test2 = testRangeCompliance(dataset, schema);
  const test3 = testDtypeEnforcement(dataset, schema);
  const test4 = testUniqueness(dataset, schema);
  const test5 = testTargetLogic(dataset, schema, domain);
  const test6 = testDomainConsistency(dataset, schema, domain);
  const test7 = testRandomness(dataset, schema);
  const test8 = testRealism(dataset, schema, domain);
  const test9 = testCorrelationCompliance(dataset, schema, domain);
  
  const weights = {
    schema_meaning: 0.10,
    range_compliance: 0.13,
    dtype_enforcement: 0.10,
    uniqueness: 0.12,
    target_logic: 0.15,
    domain_consistency: 0.10,
    randomness: 0.08,
    realism: 0.10,
    correlation_compliance: 0.12
  };
  
  const overall_score = 
    test1.score * weights.schema_meaning +
    test2.score * weights.range_compliance +
    test3.score * weights.dtype_enforcement +
    test4.score * weights.uniqueness +
    test5.score * weights.target_logic +
    test6.score * weights.domain_consistency +
    test7.score * weights.randomness +
    test8.score * weights.realism +
    test9.score * weights.correlation_compliance;
  
  const allPassed = test1.passed && test2.passed && test3.passed && 
                     test4.passed && test5.passed && test6.passed && 
                     test7.passed && test8.passed && test9.passed;
  
  const status = overall_score >= 85.0 && allPassed ? 'PASS' : 'FAIL';
  
  const report = {
    status,
    overall_score: Math.round(overall_score * 100) / 100,
    test_results: {
      schema_meaning: { score: test1.score, passed: test1.passed, issues: test1.issues },
      range_compliance: { score: test2.score, passed: test2.passed, issues: test2.issues },
      dtype_enforcement: { score: test3.score, passed: test3.passed, issues: test3.issues },
      uniqueness: { score: test4.score, passed: test4.passed, issues: test4.issues },
      target_logic: { score: test5.score, passed: test5.passed, issues: test5.issues },
      domain_consistency: { score: test6.score, passed: test6.passed, issues: test6.issues },
      randomness: { score: test7.score, passed: test7.passed, issues: test7.issues },
      realism: { score: test8.score, passed: test8.passed, issues: test8.issues },
      correlation_compliance: { score: test9.score, passed: test9.passed, issues: test9.issues }
    },
    failures: [],
    refinement_cycle: context.refinement_cycle || 0,
    accept_anyway: (context.refinement_cycle || 0) >= 3
  };
  
  if (!allPassed) {
    for (const [testName, result] of Object.entries(report.test_results)) {
      if (!result.passed) {
        report.failures.push({
          test: testName,
          score: result.score,
          issues: result.issues
        });
      }
    }
  }
  
  if (report.accept_anyway && report.failures.length > 0) {
    report.status = 'PASS';
    report.accepted_with_warnings = true;
  }
  
  return {
    ...context,
    validation_report: report,
    final_quality_score: report.overall_score,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'validation_complete',
      data: { 
        status: report.status, 
        score: report.overall_score,
        tests_passed: Object.values(report.test_results).filter(t => t.passed).length + '/9'
      }
    }]
  };
}

function testSchemaMeaning(dataset, schema) {
  const issues = [];
  let passed = true;
  let score = 100;
  
  if (!schema || !schema.columns) {
    return { score: 0, passed: false, issues: ['No schema defined'] };
  }
  
  for (const col of schema.columns) {
    const name = col.name.toLowerCase();
    
    for (const forbidden of FORBIDDEN_COLUMN_NAMES) {
      if (name === forbidden || name.startsWith(forbidden + '_')) {
        issues.push(`Forbidden column name: ${col.name}`);
        score -= 15;
        passed = false;
      }
    }
    
    if (!/^[a-z][a-z0-9_]*$/.test(col.name)) {
      issues.push(`Invalid column name format: ${col.name}`);
      score -= 10;
      passed = false;
    }
    
    if (col.name.length < 3 && col.name !== 'id') {
      issues.push(`Too short column name: ${col.name}`);
      score -= 5;
    }
  }
  
  const hasTarget = schema.columns.some(c => c.is_target);
  if (!hasTarget) {
    issues.push('No target column defined');
    score -= 20;
    passed = false;
  }
  
  return { score: Math.max(0, score), passed, issues };
}

function testRangeCompliance(dataset, schema) {
  const issues = [];
  let passed = true;
  let score = 100;
  
  if (!schema || !schema.columns) {
    return { score: 100, passed: true, issues: [] };
  }
  
  const numericCols = schema.columns.filter(c => c.dtype === 'int' || c.dtype === 'float');
  let totalValues = 0;
  let validValues = 0;
  
  for (const row of dataset) {
    for (const col of numericCols) {
      const val = row[col.name];
      if (typeof val !== 'number' || Number.isNaN(val)) continue;
      
      totalValues++;
      
      if (col.range) {
        const [min, max] = col.range;
        if (val >= min && val <= max) {
          validValues++;
        } else {
          issues.push(`Out of range: ${col.name}=${val} (expected ${min}-${max})`);
          passed = false;
        }
      } else {
        validValues++;
      }
    }
  }
  
  if (totalValues > 0) {
    score = (validValues / totalValues) * 100;
    passed = score >= 99;
  }
  
  return { score, passed, issues: issues.slice(0, 10) };
}

function testDtypeEnforcement(dataset, schema) {
  const issues = [];
  let passed = true;
  let score = 100;
  let totalChecked = 0;
  let validCount = 0;
  
  for (const row of dataset) {
    for (const col of schema.columns || []) {
      const val = row[col.name];
      if (val === undefined || val === null) continue;
      
      totalChecked++;
      
      switch (col.dtype) {
        case 'int':
          if (Number.isInteger(val)) {
            validCount++;
          } else {
            issues.push(`Int has decimal: ${col.name}=${val}`);
            passed = false;
          }
          break;
        
        case 'float':
          if (typeof val === 'number' && !Number.isNaN(val)) {
            const decimalPlaces = (val.toString().split('.')[1] || '').length;
            if (decimalPlaces <= 2) {
              validCount++;
            } else {
              issues.push(`Float exceeds 2 decimals: ${col.name}=${val}`);
            }
          }
          break;
        
        case 'boolean':
          if (val === true || val === false) {
            validCount++;
          } else {
            issues.push(`Boolean not true/false: ${col.name}=${val}`);
            passed = false;
          }
          break;
        
        case 'uuid':
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(String(val))) {
            validCount++;
          } else {
            issues.push(`Invalid UUID: ${col.name}=${val}`);
            passed = false;
          }
          break;
        
        default:
          validCount++;
      }
    }
  }
  
  if (totalChecked > 0) {
    score = (validCount / totalChecked) * 100;
  }
  
  return { score: Math.round(score * 10) / 10, passed, issues: issues.slice(0, 10) };
}

function testUniqueness(dataset, schema) {
  const issues = [];
  let passed = true;
  let score = 100;
  
  const uuidCol = schema?.columns?.find(c => c.dtype === 'uuid');
  if (uuidCol) {
    const ids = new Set();
    for (let i = 0; i < dataset.length; i++) {
      const id = dataset[i][uuidCol.name];
      if (ids.has(id)) {
        issues.push(`Duplicate ID: ${id}`);
        passed = false;
        score -= 10;
      }
      ids.add(id);
    }
  }
  
  const seen = new Set();
  let duplicates = 0;
  for (const row of dataset) {
    const hash = JSON.stringify(row);
    if (seen.has(hash)) {
      duplicates++;
      passed = false;
    }
    seen.add(hash);
  }
  
  if (duplicates > 0) {
    issues.push(`${duplicates} duplicate rows`);
    score -= duplicates * 5;
  }
  
  return { score: Math.max(0, score), passed, issues };
}

function testTargetLogic(dataset, schema, domain) {
  const issues = [];
  let passed = true;
  let score = 100;
  
  const targetCol = schema?.columns?.find(c => c.is_target);
  if (!targetCol) {
    return { score: 100, passed: true, issues: [] };
  }
  
  const targetName = targetCol.name.toLowerCase();
  
  const positiveSamples = dataset.filter(r => {
    const t = String(r[targetCol.name]).toLowerCase();
    return t.includes('positive') || t.includes('yes') || t.includes('diabetic') || t.includes('fraud') || t.includes('churn') || t.includes('high');
  });
  
  const negativeSamples = dataset.filter(r => {
    const t = String(r[targetCol.name]).toLowerCase();
    return t.includes('negative') || t.includes('no') || t.includes('healthy') || t.includes('approved') || t.includes('low');
  });
  
  if (domain === 'medical') {
    const glucoseCol = schema.columns.find(c => c.name === 'glucose');
    if (glucoseCol) {
      let logicViolations = 0;
      for (const row of positiveSamples) {
        if (row.glucose < 126) logicViolations++;
      }
      if (positiveSamples.length > 0 && logicViolations / positiveSamples.length > 0.3) {
        issues.push(`Medical logic: ${logicViolations} positive cases with low glucose`);
        score -= 15;
      }
    }
  }
  
  if (domain === 'education') {
    const gpaCol = schema.columns.find(c => c.name === 'gpa');
    if (gpaCol) {
      let logicViolations = 0;
      for (const row of negativeSamples) {
        if (row.gpa > 3.0) logicViolations++;
      }
      if (negativeSamples.length > 0 && logicViolations / negativeSamples.length > 0.3) {
        issues.push(`Education logic: ${logicViolations} fail cases with high GPA`);
        score -= 15;
      }
    }
  }
  
  if (score >= 85) passed = true;
  
  return { score: Math.max(0, score), passed, issues };
}

function testDomainConsistency(dataset, schema, domain) {
  const issues = [];
  let passed = true;
  let score = 100;
  
  const numericCols = schema?.columns?.filter(c => c.dtype === 'int' || c.dtype === 'float') || [];
  
  for (const row of dataset) {
    for (const col of numericCols) {
      const val = row[col.name];
      if (typeof val !== 'number') continue;
      
      if (domain === 'medical') {
        if (col.name.includes('bmi') && (val < 10 || val > 70)) {
          issues.push(`Unrealistic BMI for medical: ${val}`);
          score -= 10;
        }
        if (col.name.includes('heart_rate') && (val < 30 || val > 200)) {
          issues.push(`Unrealistic heart rate: ${val}`);
          score -= 10;
        }
      }
      
      if (domain === 'financial') {
        if (col.name.includes('credit_score') && (val < 200 || val > 900)) {
          issues.push(`Invalid credit score range: ${val}`);
          score -= 10;
        }
      }
      
      if (domain === 'education') {
        if ((col.name === 'gpa' || col.name.includes('gpa')) && (val < 0 || val > 4.0)) {
          issues.push(`Invalid GPA: ${val}`);
          score -= 10;
        }
      }
    }
  }
  
  if (score >= 85) passed = true;
  
  return { score: Math.max(0, score), passed, issues: issues.slice(0, 5) };
}

function testRandomness(dataset, schema) {
  const issues = [];
  let score = 100;
  
  const numericCols = (schema?.columns || []).filter(c => c.dtype === 'int' || c.dtype === 'float');
  if (numericCols.length === 0) {
    return { score: 100, passed: true, issues: [] };
  }
  
  for (const col of numericCols.slice(0, 3)) {
    const values = dataset.map(r => r[col.name]).filter(v => typeof v === 'number');
    if (values.length < 3) continue;
    
    const uniqueValues = new Set(values);
    if (uniqueValues.size === 1) {
      issues.push(`No variance in ${col.name}: all values identical`);
      score -= 20;
    }
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < mean * 0.01 && mean > 10) {
      issues.push(`Very low variance in ${col.name}`);
      score -= 10;
    }
  }
  
  return { score: Math.max(0, score), passed: score >= 85, issues };
}

function testRealism(dataset, schema, domain) {
  let score = 100;
  const issues = [];
  
  if (dataset.length < 5) {
    return { score: 100, passed: true, issues: [] };
  }
  
  const sample = dataset.slice(0, Math.min(20, dataset.length));
  
  for (const row of sample) {
    for (const [key, val] of Object.entries(row)) {
      if (val === null || val === undefined || val === '') {
        issues.push('Null/undefined values found');
        score -= 5;
      }
    }
  }
  
  const targetCol = schema?.columns?.find(c => c.is_target);
  if (targetCol) {
    const values = dataset.map(r => r[targetCol.name]);
    const unique = new Set(values);
    if (unique.size === 1) {
      issues.push('All rows have same target value');
      score -= 15;
    }
  }
  
  return { score: Math.max(0, score), passed: score >= 85, issues };
}

function testCorrelationCompliance(dataset, schema, domain) {
  const issues = [];
  let passed = true;
  let score = 100;
  
  const correlationRules = [
    { source: 'glucose', target: 'hba1c', direction: 'positive', threshold: 0.6 },
    { source: 'bmi', target: 'blood_pressure_systolic', direction: 'positive', threshold: 0.4 },
    { source: 'deaths', target: 'win_rate', direction: 'negative', threshold: 0.5 },
    { source: 'kills', target: 'kills_deaths_ratio', direction: 'positive', threshold: 0.7 },
    { source: 'pm25', target: 'aqi', direction: 'positive', threshold: 0.7 }
  ];
  
  const columnNames = schema?.columns?.map(c => c.name) || [];
  
  for (const rule of correlationRules) {
    const sourceExists = columnNames.includes(rule.source);
    const targetExists = columnNames.includes(rule.target);
    
    if (!sourceExists || !targetExists) continue;
    
    const validPairs = dataset.filter(row => 
      typeof row[rule.source] === 'number' && 
      typeof row[rule.target] === 'number' &&
      !Number.isNaN(row[rule.source]) &&
      !Number.isNaN(row[rule.target])
    );
    
    if (validPairs.length < 10) continue;
    
    const sourceVals = validPairs.map(r => r[rule.source]);
    const targetVals = validPairs.map(r => r[rule.target]);
    
    const correlation = calculatePearsonCorrelation(sourceVals, targetVals);
    
    let expectedPositive = rule.direction === 'positive';
    let isCorrectDirection = expectedPositive ? correlation > 0 : correlation < 0;
    let meetsThreshold = Math.abs(correlation) >= rule.threshold;
    
    if (!isCorrectDirection && meetsThreshold) {
      issues.push(`Correlation ${rule.source}→${rule.target} has wrong direction: ${correlation.toFixed(2)}`);
      score -= 10;
      passed = false;
    } else if (!meetsThreshold && validPairs.length > 50) {
      issues.push(`Weak correlation ${rule.source}→${rule.target}: ${correlation.toFixed(2)} (expected ≥${rule.threshold})`);
      score -= 5;
    }
  }
  
  if (domain === 'medical') {
    const targetCol = schema?.columns?.find(c => c.is_target);
    if (targetCol && columnNames.includes('glucose') && columnNames.includes('hba1c')) {
      const diabeticRows = dataset.filter(r => {
        const t = String(r[targetCol.name]).toLowerCase();
        return t.includes('diabetic') || t.includes('positive') || t.includes('yes');
      });
      
      if (diabeticRows.length > 5) {
        const avgGlucose = diabeticRows.reduce((s, r) => s + r.glucose, 0) / diabeticRows.length;
        const avgHbA1c = diabeticRows.reduce((s, r) => s + r.hba1c, 0) / diabeticRows.length;
        
        if (avgGlucose < 126) {
          issues.push(`Medical correlation: diabetic avg glucose ${avgGlucose.toFixed(1)} should be ≥126`);
          score -= 15;
          passed = false;
        }
        if (avgHbA1c < 6.5) {
          issues.push(`Medical correlation: diabetic avg HbA1c ${avgHbA1c.toFixed(1)} should be ≥6.5`);
          score -= 15;
          passed = false;
        }
      }
    }
  }
  
  return { score: Math.max(0, score), passed, issues: issues.slice(0, 10) };
}

function calculatePearsonCorrelation(x, y) {
  const n = x.length;
  if (n === 0) return 0;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function createFailContext(context, reason) {
  return {
    ...context,
    validation_report: {
      status: 'FAIL',
      overall_score: 0,
      test_results: {},
      failures: [{ test: 'system', issues: [reason] }],
      refinement_cycle: context.refinement_cycle || 0,
      accept_anyway: false
    },
    final_quality_score: 0,
    logs: [...context.logs, { timestamp: new Date().toISOString(), event: 'validation_fail', data: { reason } }]
  };
}

module.exports = { process };
