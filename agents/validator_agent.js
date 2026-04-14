/**
 * CODOZ Validator Agent
 * 
 * Analyzes and validates the constructed dataset:
 * 1. Schema relevance check
 * 2. Data quality check
 * 3. Constraint satisfaction
 * 4. Domain consistency
 */

function process(context) {
  const { dataset, schema, topicAnalysis, datasetStats } = context;
  
  if (!dataset || dataset.length === 0) {
    return {
      ...context,
      validationResult: {
        status: 'FAIL',
        score: 0,
        errors: ['Empty dataset']
      },
      logs: [...context.logs, createLog('validation_error', 'Empty dataset')]
    };
  }
  
  console.log('━'.repeat(60));
  console.log('PHASE 4: ANALYSIS & VALIDATION');
  console.log('━'.repeat(60));
  
  console.log(`\nAnalyzing dataset...`);
  console.log(`  - Rows: ${dataset.length}`);
  console.log(`  - Columns: ${Object.keys(dataset[0]).length}`);
  
  // Run validation tests
  const tests = runValidationTests(dataset, schema, topicAnalysis);
  
  // Calculate overall score
  const score = calculateValidationScore(tests);
  const status = score >= 80 ? 'PASS' : 'FAIL';
  
  console.log(`\nValidation Results:`);
  tests.forEach(test => {
    const statusIcon = test.passed ? '✓' : '✗';
    const statusText = test.passed ? 'PASS' : 'FAIL';
    console.log(`  ${statusIcon} ${test.name}: ${statusText} (${test.score}%)`);
    if (!test.passed && test.issues.length > 0) {
      test.issues.slice(0, 3).forEach(issue => {
        console.log(`      - ${issue}`);
      });
    }
  });
  
  console.log(`\nOverall Score: ${score.toFixed(1)}%`);
  console.log(`Status: ${status}`);
  
  const result = {
    status,
    score,
    tests,
    datasetStats: {
      rowCount: dataset.length,
      columnCount: Object.keys(dataset[0]).length,
      targetDistribution: datasetStats?.targetDistribution || {}
    }
  };
  
  return {
    ...context,
    validationResult: result,
    qualityScore: score,
    logs: [...context.logs, createLog('validation_complete', {
      status,
      score,
      testsPassed: tests.filter(t => t.passed).length,
      totalTests: tests.length
    })]
  };
}

function runValidationTests(dataset, schema, topicAnalysis) {
  const tests = [];
  
  // Test 1: Schema Relevance
  tests.push(testSchemaRelevance(dataset, schema, topicAnalysis));
  
  // Test 2: Data Completeness
  tests.push(testDataCompleteness(dataset, schema));
  
  // Test 3: Range Compliance
  tests.push(testRangeCompliance(dataset, schema));
  
  // Test 4: Type Enforcement
  tests.push(testTypeEnforcement(dataset, schema));
  
  // Test 5: Uniqueness
  tests.push(testUniqueness(dataset, schema));
  
  // Test 6: Target Distribution
  tests.push(testTargetDistribution(dataset, schema, topicAnalysis));
  
  // Test 7: Domain Consistency
  tests.push(testDomainConsistency(dataset, schema, topicAnalysis));
  
  // Test 8: Realism
  tests.push(testRealism(dataset, schema, topicAnalysis));
  
  return tests;
}

function testSchemaRelevance(dataset, schema, topicAnalysis) {
  const test = {
    name: 'Schema Relevance',
    description: 'Dataset schema matches topic requirements',
    passed: true,
    score: 100,
    issues: []
  };
  
  // Check if target column exists
  const targetCol = schema.columns.find(c => c.isTarget);
  if (!targetCol) {
    test.passed = false;
    test.score = 0;
    test.issues.push('No target column defined');
  }
  
  // Check if ID column exists
  const idCol = schema.columns.find(c => c.isId);
  if (!idCol) {
    test.passed = false;
    test.score -= 10;
    test.issues.push('No ID column defined');
  }
  
  // Check minimum feature count
  const featureCount = schema.columns.filter(c => !c.isTarget && !c.isId).length;
  if (featureCount < 3) {
    test.passed = false;
    test.score -= 20;
    test.issues.push(`Too few features: ${featureCount} (expected >= 3)`);
  }
  
  if (test.score < 100) test.passed = false;
  
  return test;
}

function testDataCompleteness(dataset, schema) {
  const test = {
    name: 'Data Completeness',
    description: 'All required fields are populated',
    passed: true,
    score: 100,
    issues: []
  };
  
  let totalCells = 0;
  let emptyCells = 0;
  
  dataset.forEach((row, idx) => {
    schema.columns.forEach(col => {
      if (!col.nullable) {
        totalCells++;
        const val = row[col.name];
        if (val === null || val === undefined || val === '' || val === 'None') {
          emptyCells++;
          if (test.issues.length < 5) {
            test.issues.push(`Row ${idx + 1}: Empty ${col.name}`);
          }
        }
      }
    });
  });
  
  if (emptyCells > 0) {
    test.score = ((totalCells - emptyCells) / totalCells) * 100;
    test.passed = test.score >= 99;
  }
  
  return test;
}

function testRangeCompliance(dataset, schema) {
  const test = {
    name: 'Range Compliance',
    description: 'Numeric values within defined ranges',
    passed: true,
    score: 100,
    issues: []
  };
  
  let violations = 0;
  let checked = 0;
  
  dataset.forEach((row, idx) => {
    schema.columns.forEach(col => {
      if ((col.dataType === 'int' || col.dataType === 'float') && col.range) {
        checked++;
        const val = row[col.name];
        
        if (typeof val === 'number') {
          if (val < col.range[0] || val > col.range[1]) {
            violations++;
            if (test.issues.length < 5) {
              test.issues.push(`Row ${idx + 1}: ${col.name}=${val} outside [${col.range[0]}, ${col.range[1]}]`);
            }
          }
        }
      }
    });
  });
  
  if (checked > 0) {
    test.score = ((checked - violations) / checked) * 100;
    test.passed = test.score >= 99;
  }
  
  return test;
}

function testTypeEnforcement(dataset, schema) {
  const test = {
    name: 'Type Enforcement',
    description: 'Values match expected data types',
    passed: true,
    score: 100,
    issues: []
  };
  
  let violations = 0;
  let checked = 0;
  
  dataset.forEach((row, idx) => {
    schema.columns.forEach(col => {
      const val = row[col.name];
      if (val === null || val === undefined) return;
      
      checked++;
      
      switch (col.dataType) {
        case 'int':
          if (!Number.isInteger(val)) {
            violations++;
            if (test.issues.length < 3) {
              test.issues.push(`Row ${idx + 1}: ${col.name} should be integer`);
            }
          }
          break;
        
        case 'float':
          if (typeof val !== 'number' || Number.isNaN(val)) {
            violations++;
          }
          break;
        
        case 'categorical':
          if (col.categories && !col.categories.includes(val)) {
            violations++;
            if (test.issues.length < 3) {
              test.issues.push(`Row ${idx + 1}: ${col.name}="${val}" not in valid categories`);
            }
          }
          break;
        
        case 'uuid':
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(String(val))) {
            violations++;
          }
          break;
      }
    });
  });
  
  if (checked > 0) {
    test.score = ((checked - violations) / checked) * 100;
    test.passed = test.score >= 99;
  }
  
  return test;
}

function testUniqueness(dataset, schema) {
  const test = {
    name: 'Uniqueness',
    description: 'No duplicate IDs or rows',
    passed: true,
    score: 100,
    issues: []
  };
  
  // Check ID uniqueness
  const idCol = schema.columns.find(c => c.isId);
  if (idCol) {
    const ids = dataset.map(r => r[idCol.name]);
    const uniqueIds = new Set(ids);
    
    if (uniqueIds.size !== ids.length) {
      test.passed = false;
      test.score -= 30;
      test.issues.push(`Duplicate IDs found: ${ids.length - uniqueIds.size} duplicates`);
    }
  }
  
  // Check row uniqueness
  const rowHashes = dataset.map(r => JSON.stringify(r));
  const uniqueRows = new Set(rowHashes);
  
  if (uniqueRows.size !== rowHashes.length) {
    test.passed = false;
    test.score -= 20;
    test.issues.push(`Duplicate rows found: ${rowHashes.length - uniqueRows.size} duplicates`);
  }
  
  if (test.score < 100) test.passed = false;
  
  return test;
}

function testTargetDistribution(dataset, schema, topicAnalysis) {
  const test = {
    name: 'Target Distribution',
    description: 'Target values have reasonable distribution',
    passed: true,
    score: 100,
    issues: []
  };
  
  const targetCol = schema.columns.find(c => c.isTarget);
  if (!targetCol || targetCol.dataType !== 'categorical') {
    return test; // Skip for regression
  }
  
  const dist = {};
  dataset.forEach(row => {
    const val = row[targetCol.name];
    dist[val] = (dist[val] || 0) + 1;
  });
  
  const values = Object.values(dist);
  const total = values.reduce((a, b) => a + b, 0);
  
  // Check for extreme imbalance
  for (const [val, count] of Object.entries(dist)) {
    const pct = (count / total) * 100;
    if (pct < 1 || pct > 99) {
      test.passed = false;
      test.score -= 20;
      test.issues.push(`${val}: ${pct.toFixed(1)}% (extremely imbalanced)`);
    } else if (pct < 5 || pct > 95) {
      test.score -= 10;
      test.issues.push(`${val}: ${pct.toFixed(1)}% (imbalanced)`);
    }
  }
  
  // Check expected distribution if available
  if (topicAnalysis?.classDistribution) {
    const expectedTotal = Object.values(topicAnalysis.classDistribution).reduce((a, b) => a + b, 0);
    for (const [val, expectedPct] of Object.entries(topicAnalysis.classDistribution)) {
      const actualPct = ((dist[val] || 0) / total) * 100;
      const diff = Math.abs(actualPct - (expectedPct / expectedTotal * 100));
      
      if (diff > 30) {
        test.passed = false;
        test.score -= 15;
        test.issues.push(`${val}: expected ~${(expectedPct / expectedTotal * 100).toFixed(0)}%, got ${actualPct.toFixed(0)}%`);
      }
    }
  }
  
  if (test.score < 100) test.passed = false;
  
  return test;
}

function testDomainConsistency(dataset, schema, topicAnalysis) {
  const test = {
    name: 'Domain Consistency',
    description: 'Values follow domain-specific rules',
    passed: true,
    score: 100,
    issues: []
  };
  
  const entity = topicAnalysis?.entity || 'record';
  
  // Entity-specific consistency checks
  switch (entity) {
    case 'patient':
      // Age should be reasonable for medical context
      const ageCol = schema.columns.find(c => c.name.toLowerCase().includes('age'));
      if (ageCol) {
        dataset.forEach((row, idx) => {
          const age = row[ageCol.name];
          if (age !== null && age !== undefined) {
            if (age < 0 || age > 120) {
              test.issues.push(`Row ${idx + 1}: Unreasonable age ${age}`);
              test.score -= 5;
            }
          }
        });
      }
      break;
    
    case 'transaction':
      // Transaction amounts should be positive
      const amountCol = schema.columns.find(c => 
        c.name.toLowerCase().includes('amount') || 
        c.name.toLowerCase().includes('price') ||
        c.name.toLowerCase().includes('total')
      );
      if (amountCol) {
        dataset.forEach((row, idx) => {
          const amount = row[amountCol.name];
          if (typeof amount === 'number' && amount < 0) {
            test.issues.push(`Row ${idx + 1}: Negative amount ${amount}`);
            test.score -= 5;
          }
        });
      }
      break;
  }
  
  test.passed = test.score >= 90;
  
  return test;
}

function testRealism(dataset, schema, topicAnalysis) {
  const test = {
    name: 'Realism',
    description: 'Dataset looks realistic for the domain',
    passed: true,
    score: 100,
    issues: []
  };
  
  // Check for all-same values (indicates random failure)
  schema.columns.forEach(col => {
    if (col.isId || col.isTarget) return;
    
    const values = dataset.map(r => r[col.name]);
    const uniqueValues = new Set(values);
    
    if (uniqueValues.size === 1 && values.length > 10) {
      test.passed = false;
      test.score -= 15;
      test.issues.push(`${col.name}: All values identical (${values[0]})`);
    }
  });
  
  // Check for reasonable variance in numeric columns
  const numericCols = schema.columns.filter(c => c.dataType === 'int' || c.dataType === 'float');
  numericCols.forEach(col => {
    if (col.isId || col.isTarget || !col.range) return;
    
    const values = dataset.map(r => r[col.name]).filter(v => typeof v === 'number');
    if (values.length === 0) return;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const range = col.range[1] - col.range[0];
    
    // Very low variance compared to range
    if (stdDev < range * 0.01 && range > 50) {
      test.score -= 10;
      test.issues.push(`${col.name}: Very low variance (std=${stdDev.toFixed(2)})`);
    }
  });
  
  if (test.score < 100) test.passed = false;
  
  return test;
}

function calculateValidationScore(tests) {
  const weights = {
    'Schema Relevance': 0.15,
    'Data Completeness': 0.15,
    'Range Compliance': 0.15,
    'Type Enforcement': 0.15,
    'Uniqueness': 0.10,
    'Target Distribution': 0.10,
    'Domain Consistency': 0.10,
    'Realism': 0.10
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  tests.forEach(test => {
    const weight = weights[test.name] || 0.1;
    totalScore += test.score * weight;
    totalWeight += weight;
  });
  
  return (totalScore / totalWeight);
}

function createLog(event, data) {
  return {
    timestamp: new Date().toISOString(),
    event,
    data
  };
}

module.exports = { process };
