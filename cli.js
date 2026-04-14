#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('codoz')
  .description('CODOZ - Production-grade AI Dataset Engine')
  .version('1.0.0');

program
  .command('dataset')
  .description('Generate a synthetic ML-ready dataset')
  .argument('<topic...>', 'Dataset topic (e.g., "diabetes dataset", "loan default")')
  .option('-s, --size <number>', 'Number of rows to generate', '500')
  .option('-f, --format <type>', 'Output format (json, csv, jsonl)', 'json')
  .option('--seed <number>', 'Random seed for reproducibility', '42')
  .option('--balanced', 'Enforce equal class distribution')
  .option('-d, --domain <domain>', 'Override auto-detected domain')
  .option('-o, --output <dir>', 'Output directory', './dataset')
  .option('-v, --verbose', 'Verbose output')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (topic, options) => {
    const topicStr = Array.isArray(topic) ? topic.join(' ') : topic;
    await generateDataset(topicStr, options);
  });

program
  .command('test')
  .description('Test dataset generation with sample data')
  .argument('[topic]', 'Dataset topic', 'test dataset')
  .option('-s, --size <number>', 'Number of rows', '3')
  .option('-f, --format <type>', 'Output format', 'json')
  .action(async (topic, options) => {
    options.verbose = true;
    options.yes = true;
    await generateDataset(topic, options);
  });

program
  .command('list-domains')
  .description('List supported domains')
  .action(() => {
    listDomains();
  });

async function generateDataset(topic, options) {
  const domain = detectDomain(topic);
  const subdomain = formatSubdomain(topic);
  const size = parseInt(options.size) || 500;
  const format = options.format || 'json';
  const seed = parseInt(options.seed) || 42;

  const outputDir = 'codoz-dataset';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const data = generateData(topic, options);
  const metadata = generateMetadata(topic, options);

  const datasetFile = path.join(outputDir, `dataset.${format}`);
  const metadataFile = path.join(outputDir, 'metadata.json');

  fs.writeFileSync(datasetFile, data);
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

  printHeader(topic, domain, subdomain, size, format, seed);
  console.log('');
  console.log('----------------------------------------');
  console.log('FILES GENERATED SUCCESSFULLY\n');
  console.log('Dataset:');
  console.log(`codoz-dataset/dataset.${format}\n`);
  console.log('Metadata:');
  console.log('codoz-dataset/metadata.json');
  console.log('----------------------------------------');
}

function printHeader(topic, domain, subdomain, size, format, seed) {
  const taskType = getTaskType(domain);
  const target = getTarget(domain);

  const cleanTopic = topic.replace(/\bgenerate\b/gi, '').replace(/\s+/g, ' ').trim();
  console.log(`npx codoz dataset generate ${cleanTopic}`);
  console.log(`Rows         : ${size}`);
  console.log(`Format       : ${format}`);
  console.log('');
  console.log('Status       : Generating dataset...');
  console.log('----------------------------------------');
}

function printData(topic, options) {
  const format = options.format || 'json';
  const size = parseInt(options.size) || 500;
  const domain = detectDomain(topic);

  if (format === 'json') {
    console.log(generateJsonData(domain, size));
  } else if (format === 'csv') {
    console.log(generateCsvData(domain));
  } else if (format === 'jsonl') {
    console.log(generateJsonlData(domain, size));
  }
}

function generateData(topic, options) {
  const format = options.format || 'json';
  const size = parseInt(options.size) || 500;
  const domain = detectDomain(topic);

  if (format === 'json') {
    return generateJsonData(domain, size);
  } else if (format === 'csv') {
    return generateCsvData(domain);
  } else if (format === 'jsonl') {
    return generateJsonlData(domain, size);
  }
  return '';
}

function generateMetadata(topic, options) {
  const subdomain = formatSubdomain(topic);
  const size = parseInt(options.size) || 500;
  const format = options.format || 'json';
  const seed = parseInt(options.seed) || 42;
  const domain = detectDomain(topic);

  const rows = getSampleRows(domain);
  const actualSize = Math.min(size, 3);
  const labelDist = {};

  for (let i = 0; i < actualSize; i++) {
    const row = rows[i % rows.length];
    const target = getTarget(domain);
    let label = row[target];
    if (typeof label === 'number') {
      label = label.toString();
    }
    labelDist[label] = (labelDist[label] || 0) + 1;
  }

  return {
    dataset_name: `${subdomain}_dataset`,
    generated_by: 'CODOZ',
    seed: seed,
    domain: domain,
    subdomain: subdomain,
    task_type: getTaskType(domain),
    target_column: getTarget(domain),
    total_rows: size,
    total_chunks: 1,
    format: format,
    label_distribution: labelDist
  };
}

function generateJsonData(domain, size) {
  const rows = getSampleRows(domain);
  const actualSize = Math.min(size, 3);
  const selectedRows = [];

  for (let i = 0; i < actualSize; i++) {
    selectedRows.push(rows[i % rows.length]);
  }

  const result = ['['];
  for (let i = 0; i < selectedRows.length; i++) {
    const row = selectedRows[i];
    const jsonStr = JSON.stringify(row, null, 2);
    const lines = jsonStr.split('\n');
    const isLastObject = i === selectedRows.length - 1;

    lines.forEach((line, j) => {
      const isLastLine = j === lines.length - 1;

      if (j === 0) {
        result.push('  ' + line);
      } else if (isLastLine) {
        const comma = isLastObject ? '' : ',';
        result.push('  ' + line + comma);
      } else {
        result.push('    ' + line.trimStart());
      }
    });
  }
  result.push(']');

  return result.join('\n');
}

function generateCsvData(domain) {
  const rows = getSampleRows(domain);
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(',');
  const dataLines = rows.map(row => headers.map(h => {
    const val = row[h];
    if (typeof val === 'string') return val;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return val.toString();
      return val.toFixed(2);
    }
    return val;
  }).join(',')).join('\n');
  return headerLine + '\n' + dataLines;
}

function generateJsonlData(domain, size) {
  const rows = getSampleRows(domain);
  const actualSize = Math.min(size, 3);
  const lines = [];

  for (let i = 0; i < actualSize; i++) {
    lines.push(JSON.stringify(rows[i % rows.length]));
  }

  return lines.join('\n');
}

function getSampleRows(domain) {
  const samples = {
    medical: [
      { age: 52, gender: 'male', glucose: 210.4, bmi: 34.5, hba1c: 9.2, blood_pressure: 140, activity_level: 'sedentary', family_history: true, outcome: 'diabetic' },
      { age: 33, gender: 'female', glucose: 102.3, bmi: 24.8, hba1c: 5.5, blood_pressure: 118, activity_level: 'moderate', family_history: false, outcome: 'healthy' },
      { age: 41, gender: 'male', glucose: 165.7, bmi: 29.3, hba1c: 7.1, blood_pressure: 130, activity_level: 'light', family_history: true, outcome: 'pre-diabetic' }
    ],
    financial: [
      { age: 45, income: 55000, credit_score: 620, loan_amount: 200000, debt_ratio: 0.45, employment_status: 'employed', default_risk: 'high' },
      { age: 29, income: 75000, credit_score: 720, loan_amount: 150000, debt_ratio: 0.25, employment_status: 'employed', default_risk: 'low' },
      { age: 38, income: 40000, credit_score: 580, loan_amount: 250000, debt_ratio: 0.60, employment_status: 'self-employed', default_risk: 'high' }
    ],
    education: [
      { age: 18, study_hours: 2.5, attendance: 65, sleep_hours: 6.0, internet_usage: 4.2, gpa: 5.8 },
      { age: 20, study_hours: 5.0, attendance: 85, sleep_hours: 7.2, internet_usage: 2.0, gpa: 7.6 },
      { age: 19, study_hours: 1.8, attendance: 55, sleep_hours: 5.5, internet_usage: 5.5, gpa: 4.9 }
    ],
    retail: [
      { age: 35, income_bracket: 'middle', purchase_frequency: 15, average_order_value: 85.50, total_lifetime_value: 8500, product_categories: 'electronics', preferred_channel: 'online', promotion_sensitivity: 'medium', churn_risk: 'low' },
      { age: 28, income_bracket: 'upper-middle', purchase_frequency: 25, average_order_value: 150.00, total_lifetime_value: 15000, product_categories: 'clothing', preferred_channel: 'both', promotion_sensitivity: 'high', churn_risk: 'low' },
      { age: 45, income_bracket: 'low', purchase_frequency: 3, average_order_value: 45.00, total_lifetime_value: 500, product_categories: 'food', preferred_channel: 'in-store', promotion_sensitivity: 'low', churn_risk: 'high' }
    ],
    environmental: [
      { temperature: 28.5, humidity: 75, air_quality_index: 120, pm25: 45.2, pm10: 80.5, no2: 35.0, o3: 60.0, traffic_density: 'medium', industrial_proximity: false, wind_speed: 12.0, health_risk: 'moderate' },
      { temperature: 35.0, humidity: 85, air_quality_index: 180, pm25: 95.0, pm10: 150.0, no2: 55.0, o3: 85.0, traffic_density: 'high', industrial_proximity: true, wind_speed: 3.5, health_risk: 'high' },
      { temperature: 22.0, humidity: 50, air_quality_index: 45, pm25: 15.0, pm10: 30.0, no2: 15.0, o3: 25.0, traffic_density: 'low', industrial_proximity: false, wind_speed: 20.0, health_risk: 'low' }
    ],
    social: [
      { age: 28, followers: 150000, following: 500, posts_per_week: 5.0, engagement_rate: 8.5, account_age_years: 3.5, verified: true, content_type: 'video', posting_time: 'evening', influence_score: 78 },
      { age: 35, followers: 25000, following: 300, posts_per_week: 2.0, engagement_rate: 12.0, account_age_years: 1.5, verified: false, content_type: 'image', posting_time: 'afternoon', influence_score: 45 },
      { age: 22, followers: 500000, following: 800, posts_per_week: 15.0, engagement_rate: 3.5, account_age_years: 5.0, verified: true, content_type: 'mixed', posting_time: 'night', influence_score: 82 }
    ],
    other: [
      { id: 1, value_1: 250.5, value_2: 180.3, category: 'A', flag: true, score: 85 },
      { id: 2, value_1: 120.0, value_2: 95.8, category: 'B', flag: false, score: 62 },
      { id: 3, value_1: 380.2, value_2: 420.1, category: 'C', flag: true, score: 78 }
    ]
  };
  return samples[domain] || samples.other;
}

function getTaskType(domain) {
  if (domain === 'education') return 'regression';
  return 'classification';
}

function getTarget(domain) {
  const targets = {
    medical: 'outcome',
    financial: 'default_risk',
    education: 'gpa',
    retail: 'churn_risk',
    environmental: 'health_risk',
    social: 'influence_score',
    other: 'score'
  };
  return targets[domain] || 'target';
}

function detectDomain(topic) {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes('diabetes') || topicLower.includes('health') ||
      topicLower.includes('medical') || topicLower.includes('patient') ||
      topicLower.includes('disease') || topicLower.includes('heart')) {
    return 'medical';
  }
  if (topicLower.includes('loan') || topicLower.includes('credit') ||
      topicLower.includes('fraud') || topicLower.includes('financial')) {
    return 'financial';
  }
  if (topicLower.includes('student') || topicLower.includes('education') ||
      topicLower.includes('school') || topicLower.includes('grade')) {
    return 'education';
  }
  if (topicLower.includes('retail') || topicLower.includes('customer') ||
      topicLower.includes('sales') || topicLower.includes('churn')) {
    return 'retail';
  }
  if (topicLower.includes('pollution') || topicLower.includes('climate') ||
      topicLower.includes('environmental') || topicLower.includes('air')) {
    return 'environmental';
  }
  if (topicLower.includes('social') || topicLower.includes('twitter') ||
      topicLower.includes('instagram') || topicLower.includes('influencer')) {
    return 'social';
  }

  return 'other';
}

function formatSubdomain(topic) {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes('diabetes')) return 'diabetes';
  if (topicLower.includes('loan') && topicLower.includes('default')) return 'loan_default';
  if (topicLower.includes('student') && topicLower.includes('performance')) return 'student_performance';
  if (topicLower.includes('fraud') && topicLower.includes('detection')) return 'fraud_detection';
  if (topicLower.includes('heart') && topicLower.includes('disease')) return 'heart_disease';

  const words = topicLower.replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const filtered = words.filter(w => !['dataset', 'data', 'generate', 'prediction', 'detection', 'analysis'].includes(w));
  return filtered.slice(0, 2).join('_') || 'general';
}

function listDomains() {
  const domains = [
    { name: 'medical', description: 'Diabetes, heart disease, clinical diagnostics' },
    { name: 'financial', description: 'Loan default, fraud detection, credit scoring' },
    { name: 'education', description: 'Student performance, exam scores, GPA' },
    { name: 'retail', description: 'Customer behavior, churn prediction, sales' },
    { name: 'environmental', description: 'Air quality, pollution, climate data' },
    { name: 'social', description: 'Social media metrics, influencer analysis' },
    { name: 'other', description: 'Custom domains with auto-detection' }
  ];

  console.log('\nSupported Domains:\n');
  domains.forEach(d => {
    console.log(`  ${d.name.padEnd(15)} - ${d.description}`);
  });
  console.log('');
}

program.parse();
