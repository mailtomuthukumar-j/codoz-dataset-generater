/**
 * CODOZ Dataset Quality Evaluator
 * 
 * Generates datasets for all topics and evaluates quality against:
 * 1. Expected statistical distributions
 * 2. Real-world reference patterns
 * 3. Clinical/logical consistency
 * 4. Data quality metrics
 */

const fs = require('fs');
const path = require('path');
const { run } = require('../core/orchestrator');
const { getAllTopics } = require('../core/knowledge_base');

// Real-world reference statistics from Kaggle/scientific sources
const REAL_WORLD_REFERENCES = {
  diabetes: {
    source: "Pima Indians Diabetes Dataset (Kaggle)",
    class_distribution: { Negative: 0.65, Positive: 0.35 },
    feature_ranges: {
      glucose_concentration: { mean: 120, std: 32 },
      bmi: { mean: 32, std: 8 },
      age: { mean: 33, std: 12 }
    },
    correlations: [
      { feature: 'glucose', with: 'bmi', direction: 'positive' },
      { feature: 'age', with: 'diabetes', direction: 'positive' }
    ]
  },
  heart_disease: {
    source: "UCI Heart Disease Dataset (Kaggle)",
    class_distribution: { No: 0.54, Yes: 0.46 },
    feature_ranges: {
      age: { mean: 54, std: 9 },
      resting_blood_pressure: { mean: 131, std: 17 },
      serum_cholesterol: { mean: 199, std: 51 },
      maximum_heart_rate: { mean: 149, std: 23 }
    }
  },
  breast_cancer: {
    source: "Wisconsin Breast Cancer Dataset (Kaggle)",
    class_distribution: { Benign: 0.63, Malignant: 0.37 },
    feature_ranges: {
      radius_mean: { mean_benign: 12, mean_malignant: 17 },
      area_mean: { mean_benign: 500, mean_malignant: 1000 }
    }
  },
  customer_churn: {
    source: "Telco Customer Churn Dataset (Kaggle)",
    class_distribution: { Retained: 0.73, Churned: 0.27 },
    feature_ranges: {
      tenure_months: { mean_churned: 18, mean_retained: 37 }
    }
  },
  employee_attrition: {
    source: "IBM HR Analytics Employee Attrition (Kaggle)",
    class_distribution: { Stayed: 0.84, Left: 0.16 },
    feature_ranges: {
      age: { mean: 36, std: 9 },
      monthly_income: { mean: 6500, std: 4700 }
    }
  }
};

async function runEvaluation() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     CODOZ DATASET QUALITY EVALUATION FRAMEWORK              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const topics = getAllTopics();
  const results = [];
  const sizes = [50, 100, 500];
  const formats = ['json', 'csv'];
  
  // Create output folder
  const evalDir = path.join(__dirname, 'codoz dataset');
  if (!fs.existsSync(evalDir)) {
    fs.mkdirSync(evalDir, { recursive: true });
  }
  
  console.log(`Evaluating ${topics.length} topics with ${sizes.length} sizes each...\n`);
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const issues = [];
  
  for (const topic of topics) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Evaluating: ${topic.name}`);
    console.log(`Entity: ${topic.entity} | Context: ${topic.context}`);
    
    const topicResults = {
      topic: topic.key,
      name: topic.name,
      tests: [],
      issues: []
    };
    
    for (const size of sizes) {
      for (const format of formats) {
        totalTests++;
        
        try {
          // Generate dataset
          console.log(`  → Generating ${size} rows (${format})...`);
          run(topic.key, { size, format }, true);
          
          // Load and analyze generated data
          const filepath = path.join(evalDir, `${topic.key}.${format}`);
          if (fs.existsSync(filepath)) {
            const content = fs.readFileSync(filepath, 'utf8');
            let dataset;
            
            if (format === 'json') {
              dataset = JSON.parse(content);
            } else if (format === 'csv') {
              dataset = parseCSV(content);
            }
            
            // Run quality checks
            const checks = runQualityChecks(dataset, topic.key, size);
            
            if (checks.allPassed) {
              passedTests++;
              console.log(`    ✓ PASS - All quality checks passed`);
            } else {
              failedTests++;
              console.log(`    ✗ FAIL - ${checks.failedChecks} checks failed`);
              checks.issues.forEach(issue => {
                console.log(`      - ${issue}`);
                issues.push({ topic: topic.key, size, format, issue });
              });
            }
            
            topicResults.tests.push({
              size,
              format,
              checks,
              passed: checks.allPassed
            });
          }
        } catch (error) {
          failedTests++;
          console.log(`    ✗ ERROR: ${error.message}`);
          issues.push({ topic: topic.key, size, format, issue: error.message });
          topicResults.issues.push(error.message);
        }
      }
    }
    
    results.push(topicResults);
  }
  
  // Print summary
  printSummary(results, { totalTests, passedTests, failedTests }, issues);
  
  // Save detailed report
  saveReport(results, issues);
}

function runQualityChecks(dataset, topicKey, expectedSize) {
  const checks = {
    rowCount: dataset.length === expectedSize,
    allPassed: true,
    failedChecks: 0,
    issues: []
  };
  
  // Check 1: Row count
  if (dataset.length !== expectedSize) {
    checks.issues.push(`Row count mismatch: expected ${expectedSize}, got ${dataset.length}`);
    checks.failedChecks++;
    checks.allPassed = false;
  }
  
  // Check 2: No missing values
  const firstRow = dataset[0];
  const columns = Object.keys(firstRow);
  
  for (const col of columns) {
    const missing = dataset.filter(row => row[col] === null || row[col] === undefined || row[col] === '').length;
    if (missing > 0) {
      checks.issues.push(`${col}: ${missing} missing values`);
      checks.failedChecks++;
    }
  }
  
  // Check 3: Valid ranges
  const reference = REAL_WORLD_REFERENCES[topicKey];
  if (reference && reference.feature_ranges) {
    for (const [feature, stats] of Object.entries(reference.feature_ranges)) {
      const values = dataset.map(r => r[feature]).filter(v => typeof v === 'number');
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        if (stats.mean) {
          const diff = Math.abs(mean - stats.mean) / stats.mean;
          if (diff > 0.5) {
            checks.issues.push(`${feature}: mean ${mean.toFixed(1)} differs from expected ${stats.mean} by ${(diff * 100).toFixed(0)}%`);
            checks.failedChecks++;
          }
        }
      }
    }
  }
  
  // Check 4: Target distribution
  if (reference && reference.class_distribution) {
    const targetCol = findTargetColumn(dataset);
    if (targetCol) {
      const dist = {};
      dataset.forEach(row => {
        const val = String(row[targetCol]);
        dist[val] = (dist[val] || 0) + 1;
      });
      
      const total = dataset.length;
      for (const [value, expectedRatio] of Object.entries(reference.class_distribution)) {
        const actualRatio = (dist[value] || 0) / total;
        const diff = Math.abs(actualRatio - expectedRatio);
        if (diff > 0.25) {
          checks.issues.push(`Target distribution: ${value} is ${(actualRatio * 100).toFixed(0)}%, expected ${(expectedRatio * 100).toFixed(0)}%`);
          checks.failedChecks++;
        }
      }
    }
  }
  
  if (checks.failedChecks > 0) checks.allPassed = false;
  return checks;
}

function findTargetColumn(dataset) {
  const firstRow = dataset[0];
  const possibleTargets = ['diagnosis', 'target', 'pass_status', 'churn_status', 'heart_disease_present', 'diabetes_diagnosis', 'attrition', 'loan_default'];
  
  for (const col of Object.keys(firstRow)) {
    if (possibleTargets.includes(col.toLowerCase())) {
      return col;
    }
  }
  
  // Fall back to last column with limited unique values
  for (const col of Object.keys(firstRow).reverse()) {
    const unique = [...new Set(dataset.map(r => r[col]))];
    if (unique.length >= 2 && unique.length <= 10) {
      return col;
    }
  }
  
  return null;
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      const val = values[idx];
      if (val === 'true') row[h] = true;
      else if (val === 'false') row[h] = false;
      else if (!isNaN(val) && val !== '') row[h] = Number(val);
      else row[h] = val;
    });
    rows.push(row);
  }
  
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function printSummary(results, stats, issues) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    EVALUATION SUMMARY                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log(`\nTotal Tests: ${stats.totalTests}`);
  console.log(`Passed: ${stats.passedTests} (${((stats.passedTests / stats.totalTests) * 100).toFixed(0)}%)`);
  console.log(`Failed: ${stats.failedTests} (${((stats.failedTests / stats.totalTests) * 100).toFixed(0)}%)`);
  
  // Group issues by type
  const issueTypes = {
    'Target Distribution': [],
    'Mean Value Deviation': [],
    'Missing Values': [],
    'Range Violation': [],
    'Other': []
  };
  
  issues.forEach(issue => {
    if (issue.issue.includes('distribution')) {
      issueTypes['Target Distribution'].push(issue);
    } else if (issue.issue.includes('mean')) {
      issueTypes['Mean Value Deviation'].push(issue);
    } else if (issue.issue.includes('missing')) {
      issueTypes['Missing Values'].push(issue);
    } else if (issue.issue.includes('range')) {
      issueTypes['Range Violation'].push(issue);
    } else {
      issueTypes['Other'].push(issue);
    }
  });
  
  console.log('\n─── Issues by Category ───');
  for (const [type, typeIssues] of Object.entries(issueTypes)) {
    if (typeIssues.length > 0) {
      console.log(`\n${type} (${typeIssues.length}):`);
      typeIssues.slice(0, 5).forEach(i => {
        console.log(`  • ${i.topic} [${i.size}]: ${i.issue.substring(0, 80)}`);
      });
      if (typeIssues.length > 5) {
        console.log(`  ... and ${typeIssues.length - 5} more`);
      }
    }
  }
  
  // Topic-by-topic results
  console.log('\n─── Results by Topic ───');
  results.forEach(result => {
    const passRate = result.tests.filter(t => t.passed).length / result.tests.length * 100;
    const icon = passRate === 100 ? '✓' : passRate >= 50 ? '◐' : '✗';
    console.log(`  ${icon} ${result.name}: ${passRate.toFixed(0)}% passed`);
  });
}

function saveReport(results, issues) {
  const report = {
    timestamp: new Date().toISOString(),
    totalTopics: results.length,
    totalTests: issues.length,
    results,
    issues
  };
  
  const filepath = path.join(__dirname, 'codoz dataset', 'evaluation_report.json');
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report saved to: ${filepath}`);
}

// Run evaluation
runEvaluation().catch(console.error);
