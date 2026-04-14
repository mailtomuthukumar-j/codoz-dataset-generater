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
  .option('-y, --yes', 'Skip confirmation')
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
  const schema = getRealisticSchema(domain);

  let attempts = 0;
  let data = '';
  let metadata = {};

  while (attempts < 5) {
    const rows = generateRealisticRows(domain, schema, finalSize);
    data = formatData(rows, finalFormat);
    metadata = generateMetadata(finalTopic, { format: finalFormat, size: finalSize, domain, subdomain, schema, rows });
    const actualRows = countRows(data, finalFormat);
    if (actualRows === finalSize && !hasDuplicates(rows)) {
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
  const schema = getRealisticSchema(domain);

  let attempts = 0;
  let data = '';
  let rows = [];

  while (attempts < 5) {
    rows = generateRealisticRows(domain, schema, size);
    data = formatData(rows, format);
    if (countRows(data, format) === size && !hasDuplicates(rows)) {
      break;
    }
    attempts++;
  }

  const metadata = generateMetadata(topic, { format, size, domain, subdomain, schema, rows });

  const outputDir = 'codoz-dataset';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, `dataset.${format}`), data);
  fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  console.log('✅ Done!\n');
  console.log(`   Output: ${outputDir}/dataset.${format}\n`);
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

function getRealisticSchema(domain) {
  const schemas = {
    medical: {
      columns: ['patient_id', 'age', 'gender', 'bmi', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'glucose_level', 'hba1c', 'insulin', 'bmi_category', 'waist_circumference', 'family_history_diabetes', 'smoking_status', 'physical_activity', 'diet_quality', 'outcome'],
      target: 'outcome',
      ranges: {
        age: { min: 18, max: 85 },
        bmi: { min: 16, max: 55 },
        blood_pressure_systolic: { min: 90, max: 200 },
        blood_pressure_diastolic: { min: 60, max: 130 },
        glucose_level: { min: 70, max: 350 },
        hba1c: { min: 4.0, max: 14.0 },
        insulin: { min: 2, max: 50 },
        waist_circumference: { min: 60, max: 150 }
      }
    },
    financial: {
      columns: ['customer_id', 'age', 'income_annual', 'credit_score', 'debt_to_income_ratio', 'loan_amount', 'loan_term_months', 'employment_years', 'employment_status', 'home_ownership', 'debt_amount', 'credit_card_utilization', 'num_open_accounts', 'derogatory_marks', 'loan_intent', 'default_risk'],
      target: 'default_risk',
      ranges: {
        age: { min: 18, max: 75 },
        income_annual: { min: 15000, max: 250000 },
        credit_score: { min: 300, max: 850 },
        debt_to_income_ratio: { min: 0.05, max: 0.65 },
        loan_amount: { min: 1000, max: 500000 },
        loan_term_months: { min: 6, max: 60 },
        employment_years: { min: 0, max: 40 },
        debt_amount: { min: 0, max: 100000 },
        credit_card_utilization: { min: 0, max: 100 },
        num_open_accounts: { min: 1, max: 20 }
      }
    },
    education: {
      columns: ['student_id', 'age', 'study_hours_per_week', 'attendance_percentage', 'sleep_hours', 'internet_usage_hours', 'parental_education', 'socioeconomic_status', 'part_time_job', 'extracurricular', 'prior_gpa', 'midterm_score', 'final_exam_score', 'assignment_completion', 'participation_score', 'gpa'],
      target: 'gpa',
      ranges: {
        age: { min: 17, max: 30 },
        study_hours_per_week: { min: 0, max: 40 },
        attendance_percentage: { min: 30, max: 100 },
        sleep_hours: { min: 4, max: 10 },
        internet_usage_hours: { min: 0, max: 15 },
        prior_gpa: { min: 0, max: 4.0 },
        midterm_score: { min: 0, max: 100 },
        final_exam_score: { min: 0, max: 100 },
        assignment_completion: { min: 0, max: 100 },
        participation_score: { min: 0, max: 100 }
      }
    },
    retail: {
      columns: ['customer_id', 'age', 'gender', 'annual_income', 'spending_score', 'purchase_frequency', 'average_order_value', 'product_diversity', 'preferred_category', 'membership_years', 'days_since_last_purchase', 'promotion_response_rate', 'online_vs_offline_ratio', 'return_rate', 'customer_support_tickets', 'churn_risk'],
      target: 'churn_risk',
      ranges: {
        age: { min: 18, max: 70 },
        annual_income: { min: 20000, max: 200000 },
        spending_score: { min: 1, max: 100 },
        purchase_frequency: { min: 1, max: 100 },
        average_order_value: { min: 10, max: 1000 },
        product_diversity: { min: 1, max: 15 },
        membership_years: { min: 0, max: 15 },
        days_since_last_purchase: { min: 1, max: 365 },
        promotion_response_rate: { min: 0, max: 100 },
        online_vs_offline_ratio: { min: 0, max: 100 },
        return_rate: { min: 0, max: 50 }
      }
    },
    environmental: {
      columns: ['station_id', 'temperature_celsius', 'humidity_percent', 'air_quality_index', 'pm25_concentration', 'pm10_concentration', 'no2_ppb', 'o3_ppb', 'so2_ppb', 'co_ppm', 'wind_speed_kmh', 'wind_direction', 'precipitation_mm', 'traffic_density', 'industrial_proximity', 'health_risk_level'],
      target: 'health_risk_level',
      ranges: {
        temperature_celsius: { min: -10, max: 45 },
        humidity_percent: { min: 20, max: 100 },
        air_quality_index: { min: 0, max: 500 },
        pm25_concentration: { min: 0, max: 500 },
        pm10_concentration: { min: 0, max: 400 },
        no2_ppb: { min: 0, max: 200 },
        o3_ppb: { min: 0, max: 180 },
        so2_ppb: { min: 0, max: 100 },
        co_ppm: { min: 0, max: 10 },
        wind_speed_kmh: { min: 0, max: 150 },
        precipitation_mm: { min: 0, max: 200 }
      }
    },
    social: {
      columns: ['user_id', 'age', 'followers_count', 'following_count', 'posts_count', 'avg_engagement_rate', 'content_type', 'posting_frequency_per_week', 'account_age_years', 'verified_status', 'brand_partnerships', 'stories_per_week', 'reels_percentage', 'hashtag_usage_rate', 'avg_likes_received', 'influence_tier'],
      target: 'influence_tier',
      ranges: {
        age: { min: 16, max: 65 },
        followers_count: { min: 100, max: 10000000 },
        following_count: { min: 50, max: 5000 },
        posts_count: { min: 10, max: 10000 },
        avg_engagement_rate: { min: 0.1, max: 25 },
        posting_frequency_per_week: { min: 0.5, max: 50 },
        account_age_years: { min: 0.1, max: 15 },
        brand_partnerships: { min: 0, max: 500 },
        stories_per_week: { min: 0, max: 50 },
        reels_percentage: { min: 0, max: 100 },
        hashtag_usage_rate: { min: 0, max: 30 },
        avg_likes_received: { min: 10, max: 2000000 }
      }
    }
  };
  return schemas[domain] || schemas.other;
}

function getOtherSchema() {
  return {
    columns: ['id', 'feature_1', 'feature_2', 'feature_3', 'feature_4', 'feature_5', 'target'],
    target: 'target',
    ranges: { feature_1: { min: 0, max: 100 }, feature_2: { min: 0, max: 100 }, feature_3: { min: 0, max: 100 }, feature_4: { min: 0, max: 100 }, feature_5: { min: 0, max: 100 } }
  };
}

function generateRealisticRows(domain, schema, size) {
  const rows = [];
  const seen = new Set();

  for (let i = 0; i < size; i++) {
    let row = generateRow(domain, schema, i);
    let attempts = 0;

    while (seen.has(JSON.stringify(row).slice(0, 100)) && attempts < 10) {
      row = generateRow(domain, schema, i);
      attempts++;
    }

    seen.add(JSON.stringify(row).slice(0, 100));
    rows.push(row);
  }

  return rows;
}

function generateRow(domain, schema, index) {
  const row = {};
  const ranges = schema.ranges || {};

  schema.columns.forEach(col => {
    if (col === schema.target) return;

    const range = ranges[col.replace(/_/g, '_')] || ranges[col] || { min: 0, max: 100 };

    if (col === 'patient_id' || col === 'customer_id' || col === 'student_id' || col === 'station_id' || col === 'user_id' || col === 'id') {
      row[col] = `${col.split('_')[0]}_${String(index + 1).padStart(6, '0')}`;
    } else if (col === 'gender' || col === 'employment_status' || col === 'home_ownership' || col === 'loan_intent' || col === 'preferred_category' || col === 'content_type' || col === 'verified_status' || col === 'smoking_status' || col === 'bmi_category' || col === 'socioeconomic_status' || col === 'part_time_job' || col === 'extracurricular' || col === 'traffic_density' || col === 'industrial_proximity' || col === 'wind_direction') {
      row[col] = pickRandom(getCategoricalValues(col));
    } else if (col === 'family_history_diabetes' || col === 'parental_education' || col === 'membership_years') {
      row[col] = pickRandom(getCategoricalValues(col));
    } else if (typeof range.min === 'number' && typeof range.max === 'number') {
      row[col] = generateRealisticValue(col, range.min, range.max, domain);
    }
  });

  row[schema.target] = generateTarget(domain, row, schema.target);
  return row;
}

function generateRealisticValue(col, min, max, domain) {
  const isDecimal = min < 0 || max > 100 || col.includes('ratio') || col.includes('rate') || col.includes('percent') || col.includes('score');
  const value = min + Math.random() * (max - min);

  if (col === 'credit_score') return Math.round(value);
  if (col === 'age' || col === 'employment_years' || col === 'num_open_accounts' || col === 'derogatory_marks' || col === 'loan_term_months' || col === 'prior_gpa' || col === 'midterm_score' || col === 'final_exam_score' || col === 'assignment_completion' || col === 'participation_score') {
    return Math.round(value * 10) / 10;
  }
  if (col === 'sleep_hours' || col === 'study_hours_per_week' || col === 'internet_usage_hours') {
    return Math.round(value * 10) / 10;
  }
  if (col === 'hba1c' || col === 'debt_to_income_ratio' || col === 'co_ppm') {
    return Math.round(value * 100) / 100;
  }
  if (col === 'avg_engagement_rate' || col === 'posting_frequency_per_week') {
    return Math.round(value * 100) / 100;
  }
  if (col === 'pm25_concentration' || col === 'pm10_concentration' || col === 'o3_ppb' || col === 'no2_ppb' || col === 'so2_ppb') {
    return Math.round(value * 10) / 10;
  }
  if (isDecimal) {
    return Math.round(value * 100) / 100;
  }

  return Math.round(value);
}

function generateTarget(domain, row, target) {
  if (domain === 'medical') {
    const risk = (row.hba1c > 6.5 ? 2 : row.hba1c > 5.7 ? 1 : 0) + (row.bmi > 30 ? 1 : 0) + (row.glucose_level > 140 ? 1 : 0);
    const rand = Math.random();
    if (risk >= 2 || rand < 0.15) return 'diabetic';
    if (risk === 1 || (rand >= 0.15 && rand < 0.35)) return 'pre-diabetic';
    return 'healthy';
  }

  if (domain === 'financial') {
    const riskScore = (row.credit_score < 600 ? 3 : row.credit_score < 700 ? 1 : 0) +
                      (row.debt_to_income_ratio > 0.4 ? 2 : row.debt_to_income_ratio > 0.3 ? 1 : 0) +
                      (row.derogatory_marks > 0 ? 2 : 0);
    if (riskScore >= 3 || Math.random() < 0.2) return 'high';
    if (riskScore >= 1 || Math.random() < 0.4) return 'medium';
    return 'low';
  }

  if (domain === 'education') {
    const performance = (row.study_hours_per_week * 3) + row.attendance_percentage + (row.prior_gpa * 20) - (row.internet_usage_hours * 2);
    if (performance > 250 || Math.random() < 0.15) return Math.round((3.5 + Math.random() * 0.5) * 100) / 100;
    if (performance > 180 || Math.random() < 0.4) return Math.round((2.5 + Math.random() * 1.0) * 100) / 100;
    return Math.round((1.0 + Math.random() * 1.5) * 100) / 100;
  }

  if (domain === 'retail') {
    const risk = (row.days_since_last_purchase > 90 ? 3 : row.days_since_last_purchase > 60 ? 2 : row.days_since_last_purchase > 30 ? 1 : 0) +
                 (row.return_rate > 20 ? 2 : row.return_rate > 10 ? 1 : 0) +
                 (row.promotion_response_rate < 10 ? 1 : 0);
    if (risk >= 3) return 'high';
    if (risk >= 1) return 'medium';
    return 'low';
  }

  if (domain === 'environmental') {
    const aqi = row.air_quality_index || 50;
    if (aqi > 150) return 'high';
    if (aqi > 100) return 'moderate';
    if (aqi > 50) return 'low';
    return 'good';
  }

  if (domain === 'social') {
    const score = Math.log10(row.followers_count + 1) * 20 + row.avg_engagement_rate * 2;
    if (score > 80) return 'influencer';
    if (score > 50) return 'micro_influencer';
    if (score > 25) return 'active';
    return 'casual';
  }

  return Math.random() > 0.5 ? 'positive' : 'negative';
}

function getCategoricalValues(col) {
  const cats = {
    gender: ['male', 'female'],
    employment_status: ['employed', 'self-employed', 'unemployed', 'student'],
    home_ownership: ['rent', 'own', 'mortgage'],
    loan_intent: ['debt_consolidation', 'home_improvement', 'major_purchase', 'medical', 'education', 'venture'],
    preferred_category: ['electronics', 'clothing', 'food', 'home', 'beauty', 'sports'],
    content_type: ['video', 'image', 'carousel', 'reels', 'stories'],
    verified_status: ['verified', 'unverified'],
    smoking_status: ['never', 'former', 'current'],
    bmi_category: ['underweight', 'normal', 'overweight', 'obese'],
    socioeconomic_status: ['low', 'middle', 'high'],
    part_time_job: ['yes', 'no'],
    extracurricular: ['yes', 'no'],
    traffic_density: ['low', 'medium', 'high', 'very_high'],
    industrial_proximity: ['yes', 'no'],
    wind_direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    parental_education: ['high_school', 'bachelors', 'masters', 'phd'],
    family_history_diabetes: ['yes', 'no']
  };
  return cats[col] || ['category_a', 'category_b'];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hasDuplicates(rows) {
  const seen = new Set();
  for (const row of rows) {
    const key = JSON.stringify(row).slice(0, 100);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
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

function formatData(rows, format) {
  if (format === 'json') {
    return JSON.stringify(rows, null, 2);
  }
  if (format === 'csv') {
    const headers = Object.keys(rows[0]);
    const headerLine = headers.join(',');
    const dataLines = rows.map(row => headers.map(h => {
      const val = row[h];
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(','));
    return headerLine + '\n' + dataLines.join('\n');
  }
  if (format === 'jsonl') {
    return rows.map(row => JSON.stringify(row)).join('\n');
  }
  return JSON.stringify(rows);
}

function generateMetadata(topic, options) {
  const domain = options.domain;
  const schema = options.schema || getOtherSchema();
  const rows = options.rows || [];
  const target = schema.target;

  const labelDist = {};
  rows.forEach(row => {
    const label = row[target];
    const key = typeof label === 'number' ? label.toFixed(2) : label;
    labelDist[key] = (labelDist[key] || 0) + 1;
  });

  return {
    dataset_name: `${options.subdomain}_dataset`,
    generated_by: 'CODOZ',
    seed: 42,
    domain: domain,
    subdomain: options.subdomain,
    task_type: domain === 'education' ? 'regression' : 'classification',
    target_column: target,
    total_rows: options.size,
    format: options.format,
    columns: schema.columns,
    label_distribution: labelDist
  };
}

program.parse();
