#!/usr/bin/env node

const { Command } = require('commander');
const prompts = require('prompts');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('codoz')
  .description('CODOZ - AI Dataset Generator for ML-ready synthetic data')
  .version('1.0.0');

program
  .command('dataset')
  .description('Generate a dataset (interactive mode)')
  .argument('[topic]', 'Dataset topic (optional)')
  .option('-s, --size <number>', 'Dataset size')
  .option('-f, --format <type>', 'Output format')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (topicArg, options) => {
    await runGenerator(topicArg, options);
  });

program
  .command('generate')
  .description('Quick generate (non-interactive)')
  .argument('<topic...>', 'Dataset topic')
  .option('-s, --size <number>', 'Dataset size', '500')
  .option('-f, --format <type>', 'Output format', 'json')
  .action(async (topic, options) => {
    const topicStr = Array.isArray(topic) ? topic.join(' ') : topic;
    await quickGenerate(topicStr, options);
  });

async function runGenerator(topicArg, options) {
  console.log('\n📊 CODOZ Dataset Generator\n');
  console.log('━'.repeat(40) + '\n');

  let finalTopic = topicArg;
  let finalSize = parseInt(options.size) || 500;
  let finalFormat = options.format || 'json';
  let answers = {};

  const needsTopic = !finalTopic;
  const needsSize = !options.size;
  const needsFormat = !options.format;

  if (needsTopic || needsSize || needsFormat) {
    const questions = [];

    if (needsTopic) {
      questions.push({
        type: 'text',
        name: 'topic',
        message: 'Dataset Topic:',
        validate: val => val.length > 0 ? true : 'Topic is required'
      });
    }

    if (needsSize) {
      questions.push({
        type: 'text',
        name: 'size',
        message: 'Enter dataset size:',
        initial: '500'
      });
    }

    if (needsFormat) {
      questions.push({
        type: 'select',
        name: 'format',
        message: 'Select dataset format:',
        choices: [
          { title: 'json', description: 'JSON array format', value: 'json' },
          { title: 'csv', description: 'CSV format', value: 'csv' },
          { title: 'jsonl', description: 'JSON Lines format', value: 'jsonl' }
        ],
        initial: 0
      });
    }

    if (!options.yes) {
      questions.push({
        type: 'confirm',
        name: 'confirm',
        message: 'Confirm generation?',
        initial: true
      });
    }

    try {
      answers = await prompts(questions, {
        onCancel: () => {
          console.log('\n\n❌ Generation cancelled.\n');
          process.exit(0);
        }
      });
    } catch (e) {
      console.log('\n\n❌ Generation cancelled.\n');
      process.exit(0);
    }

    if (!options.yes && answers.confirm === false) {
      console.log('\n\n❌ Generation cancelled.\n');
      return;
    }

    finalTopic = finalTopic || answers.topic || 'dataset';
    finalSize = needsSize ? parseInt(answers.size) || 500 : finalSize;
    finalFormat = finalFormat || answers.format || 'json';
  }

  console.log('📋 Summary:');
  console.log(`   Topic:  ${finalTopic}`);
  console.log(`   Size:   ${finalSize}`);
  console.log(`   Format: ${finalFormat}`);
  console.log('━'.repeat(40) + '\n');

  console.log('🔄 Generating dataset...\n');

  const domain = detectDomain(finalTopic);
  const subdomain = formatSubdomain(finalTopic);

  let attempts = 0;
  const maxAttempts = 5;
  let data = '';
  let metadata = {};

  while (attempts < maxAttempts) {
    data = generateData(finalTopic, { format: finalFormat, size: finalSize, domain, samples: getSamples(domain) });
    metadata = generateMetadata(finalTopic, { format: finalFormat, size: finalSize, domain, subdomain, target: getTarget(domain) });

    const actualRows = countRows(data, finalFormat);
    if (actualRows === finalSize) {
      break;
    }
    attempts++;
  }

  const outputDir = 'codoz-dataset';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, `dataset.${finalFormat}`), data);
  fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  console.log('✅ Generation completed!\n');
  console.log('━'.repeat(40));
  console.log('📁 FILES GENERATED:\n');
  console.log(`   Dataset:  ${outputDir}/dataset.${finalFormat}`);
  console.log(`   Metadata: ${outputDir}/metadata.json`);
  console.log('━'.repeat(40) + '\n');
}

async function quickGenerate(topic, options) {
  const format = options.format || 'json';
  const size = parseInt(options.size) || 500;

  console.log(`\n📊 Generating dataset for: ${topic}\n`);

  const domain = detectDomain(topic);
  const subdomain = formatSubdomain(topic);
  const samples = getSamples(domain);
  const target = getTarget(domain);

  let attempts = 0;
  let data = '';

  while (attempts < 5) {
    data = generateData(topic, { format, size, domain, samples });
    const actualRows = countRows(data, format);
    if (actualRows === size) break;
    attempts++;
  }

  const metadata = generateMetadata(topic, { format, size, domain, subdomain, target });

  const outputDir = 'codoz-dataset';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, `dataset.${format}`), data);
  fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  console.log('✅ Done!\n');
  console.log(`   Output: ${outputDir}/dataset.${format}\n`);
}

function countRows(data, format) {
  if (format === 'json') {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.length : 0;
  }
  if (format === 'csv') {
    const lines = data.split('\n').filter(line => line.trim().length > 0);
    return Math.max(0, lines.length - 1);
  }
  if (format === 'jsonl') {
    return data.split('\n').filter(line => line.trim().length > 0).length;
  }
  return 0;
}

function detectDomain(topic) {
  const t = topic.toLowerCase();
  if (t.includes('diabetes') || t.includes('health') || t.includes('medical')) return 'medical';
  if (t.includes('loan') || t.includes('credit') || t.includes('fraud') || t.includes('financial')) return 'financial';
  if (t.includes('student') || t.includes('education') || t.includes('school')) return 'education';
  if (t.includes('retail') || t.includes('customer') || t.includes('churn')) return 'retail';
  if (t.includes('pollution') || t.includes('climate') || t.includes('air')) return 'environmental';
  if (t.includes('social') || t.includes('twitter') || t.includes('influencer')) return 'social';
  return 'other';
}

function formatSubdomain(topic) {
  const t = topic.toLowerCase();
  if (t.includes('diabetes')) return 'diabetes';
  if (t.includes('loan') && t.includes('default')) return 'loan_default';
  if (t.includes('student') && t.includes('performance')) return 'student_performance';
  if (t.includes('fraud') && t.includes('detection')) return 'fraud_detection';
  const words = t.replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const filtered = words.filter(w => !['dataset', 'data', 'generate', 'prediction'].includes(w));
  return filtered.slice(0, 2).join('_') || 'general';
}

function getSamples(domain) {
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
    other: [
      { id: 1, value_1: 250.5, value_2: 180.3, category: 'A', flag: true, score: 85 },
      { id: 2, value_1: 120.0, value_2: 95.8, category: 'B', flag: false, score: 62 },
      { id: 3, value_1: 380.2, value_2: 420.1, category: 'C', flag: true, score: 78 }
    ]
  };
  return samples[domain] || samples.other;
}

function getTarget(domain) {
  const targets = { medical: 'outcome', financial: 'default_risk', education: 'gpa' };
  return targets[domain] || 'score';
}

function generateData(topic, options) {
  const domain = options.domain || detectDomain(topic);
  const samples = options.samples || getSamples(domain);
  const size = options.size || 3;
  const rows = [];

  for (let i = 0; i < size; i++) {
    rows.push({ ...samples[i % samples.length] });
  }

  if (options.format === 'csv') {
    const headers = Object.keys(rows[0]);
    const headerLine = headers.join(',');
    const dataLines = rows.map(row => headers.map(h => {
      const val = row[h];
      if (typeof val === 'string') return val;
      if (typeof val === 'boolean') return val ? 'true' : 'false';
      if (typeof val === 'number') return Number.isInteger(val) ? val : val.toFixed(2);
      return val;
    }).join(','));
    return headerLine + '\n' + dataLines.join('\n');
  }

  if (options.format === 'jsonl') {
    return rows.map(row => JSON.stringify(row)).join('\n');
  }

  return JSON.stringify(rows, null, 2);
}

function generateMetadata(topic, options) {
  const domain = options.domain || detectDomain(topic);
  const subdomain = options.subdomain || formatSubdomain(topic);
  const size = options.size || 3;
  const samples = options.samples || getSamples(domain);
  const target = options.target || getTarget(domain);

  const labelDist = {};
  for (let i = 0; i < size; i++) {
    const label = samples[i % samples.length][target];
    const key = typeof label === 'number' ? label.toString() : label;
    labelDist[key] = (labelDist[key] || 0) + 1;
  }

  return {
    dataset_name: `${subdomain}_dataset`,
    generated_by: 'CODOZ',
    seed: 42,
    domain,
    subdomain,
    task_type: domain === 'education' ? 'regression' : 'classification',
    target_column: target,
    total_rows: size,
    format: options.format || 'json',
    label_distribution: labelDist
  };
}

program.parse();
