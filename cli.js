#!/usr/bin/env node

const prompts = require('prompts');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function main() {
  if (args.length === 0) {
    runInteractive();
    return;
  }

  const firstArg = args[0];
  const combinedArgs = args.join(' ');

  if (firstArg === 'dataset' || firstArg === 'generate') {
    parseCommand(args.slice(1));
  } else if (firstArg === '--help' || firstArg === '-h') {
    showHelp();
  } else if (combinedArgs.includes('generate')) {
    const generateIndex = args.indexOf('generate');
    parseCommand(args.slice(generateIndex + 1));
  } else {
    const topic = args.join(' ');
    const options = parseOptions(args);
    runGenerator(topic, options);
  }
}

function parseCommand(subArgs) {
  let topicParts = [];
  const options = { size: '500', format: 'json', yes: true };

  for (let i = 0; i < subArgs.length; i++) {
    const part = subArgs[i];

    if (part === '--size' || part === '-s') {
      options.size = subArgs[i + 1] || '500';
      i++;
    } else if (part === '--format' || part === '-f') {
      options.format = subArgs[i + 1] || 'json';
      i++;
    } else if (part === '--yes' || part === '-y') {
      options.yes = true;
    } else if (part === '--help' || part === '-h') {
      showHelp();
      return;
    } else if (part === 'generate') {
      continue;
    } else {
      topicParts.push(part);
    }
  }

  const topic = topicParts.join(' ');

  if (topic) {
    runGenerator(topic, options);
  } else {
    runInteractive();
  }
}

function parseOptions(args) {
  const options = { size: '500', format: 'json', yes: true };

  for (let i = 0; i < args.length; i++) {
    const part = args[i];

    if (part === '--size' || part === '-s') {
      options.size = args[i + 1] || '500';
      i++;
    } else if (part === '--format' || part === '-f') {
      options.format = args[i + 1] || 'json';
      i++;
    } else if (part === '--yes' || part === '-y') {
      options.yes = true;
    }
  }

  return options;
}

function showHelp() {
  console.log('\nCODOZ - AI Dataset Generator\n');
  console.log('Usage:');
  console.log('  npx codoz dataset generate <topic> [options]');
  console.log('  npx codoz generate <topic> [options]');
  console.log('\nOptions:');
  console.log('  -s, --size <number>    Dataset size (default: 500)');
  console.log('  -f, --format <type>    Output format: json, csv, jsonl (default: json)');
  console.log('  -y, --yes              Skip confirmation');
  console.log('\nExamples:');
  console.log('  npx codoz dataset generate diabetes --size 10');
  console.log('  npx codoz generate "loan default" --format csv\n');
}

async function runInteractive() {
  console.log('\n📊 CODOZ Dataset Generator\n');
  console.log('━'.repeat(40) + '\n');

  const questions = [
    {
      type: 'text',
      name: 'topic',
      message: 'Dataset Topic:',
      initial: 'diabetes'
    },
    {
      type: 'text',
      name: 'size',
      message: 'Enter dataset size:',
      initial: '500'
    },
    {
      type: 'select',
      name: 'format',
      message: 'Select dataset format:',
      choices: [
        { title: 'json', description: 'JSON array format', value: 'json' },
        { title: 'csv', description: 'CSV format', value: 'csv' },
        { title: 'jsonl', description: 'JSON Lines format', value: 'jsonl' }
      ],
      initial: 0
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Confirm generation?',
      initial: true
    }
  ];

  let answers = {};
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

  if (answers.confirm === false) {
    console.log('\n\n❌ Generation cancelled.\n');
    return;
  }

  const options = {
    size: parseInt(answers.size) || 500,
    format: answers.format || 'json',
    yes: true
  };

  await runGenerator(answers.topic, options);
}

async function runGenerator(topicArg, options) {
  console.log('\n📊 CODOZ Dataset Generator\n');
  console.log('━'.repeat(40) + '\n');

  const finalTopic = topicArg || 'dataset';
  const finalSize = parseInt(options.size) || 500;
  const finalFormat = options.format || 'json';

  console.log('📋 Summary:');
  console.log(`   Topic:  ${finalTopic}`);
  console.log(`   Size:   ${finalSize}`);
  console.log(`   Format: ${finalFormat}`);
  console.log('━'.repeat(40) + '\n');

  console.log('🔄 Generating dataset...\n');

  const domain = detectDomain(finalTopic);
  const subdomain = formatSubdomain(finalTopic);
  const schema = getRealisticSchema(domain);

  if (!schema) {
    console.error('❌ Schema generation failed for domain:', domain);
    process.exit(1);
  }

  if (!schema.columns || !schema.target) {
    console.error('❌ Invalid schema structure');
    process.exit(1);
  }

  const schemaRanges = schema?.ranges || {};
  let attempts = 0;
  let data = '';
  let rows = [];

  while (attempts < 5) {
    rows = generateRealisticRows(domain, schema, schemaRanges, finalSize);
    data = formatData(rows, finalFormat);
    const actualRows = countRows(data, finalFormat);
    if (actualRows === finalSize && !hasDuplicates(rows)) {
      break;
    }
    attempts++;
  }

  const metadata = generateMetadata(finalTopic, { format: finalFormat, size: finalSize, domain, subdomain, schema, rows });

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
        waist_circumference: { min: 60, max: 150 },
        physical_activity: { min: 0, max: 100 },
        diet_quality: { min: 0, max: 100 }
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
        num_open_accounts: { min: 1, max: 20 },
        derogatory_marks: { min: 0, max: 10 }
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
      columns: ['customer_id', 'age', 'annual_income', 'spending_score', 'purchase_frequency', 'average_order_value', 'product_diversity', 'preferred_category', 'membership_years', 'days_since_last_purchase', 'promotion_response_rate', 'online_vs_offline_ratio', 'return_rate', 'customer_support_tickets', 'churn_risk'],
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
        return_rate: { min: 0, max: 50 },
        customer_support_tickets: { min: 0, max: 20 }
      }
    },
    environmental: {
      columns: ['station_id', 'temperature_celsius', 'humidity_percent', 'air_quality_index', 'pm25_concentration', 'pm10_concentration', 'no2_ppb', 'o3_ppb', 'so2_ppb', 'co_ppm', 'wind_speed_kmh', 'precipitation_mm', 'traffic_density', 'industrial_proximity', 'health_risk_level'],
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

  return schemas[domain] || {
    columns: ['id', 'feature_1', 'feature_2', 'feature_3', 'feature_4', 'feature_5', 'target'],
    target: 'target',
    ranges: {
      feature_1: { min: 0, max: 100 },
      feature_2: { min: 0, max: 100 },
      feature_3: { min: 0, max: 100 },
      feature_4: { min: 0, max: 100 },
      feature_5: { min: 0, max: 100 }
    }
  };
}

function generateRealisticRows(domain, schema, schemaRanges, size) {
  if (!schema || !schema.columns || !schema.target) {
    throw new Error('Invalid schema: missing columns or target');
  }

  const rows = [];
  const seen = new Set();

  for (let i = 0; i < size; i++) {
    let row = generateRow(domain, schema, schemaRanges, i);
    let attempts = 0;

    while (seen.has(JSON.stringify(row).slice(0, 100)) && attempts < 10) {
      row = generateRow(domain, schema, schemaRanges, i);
      attempts++;
    }

    seen.add(JSON.stringify(row).slice(0, 100));
    rows.push(row);
  }

  return rows;
}

function generateRow(domain, schema, schemaRanges, index) {
  if (!schema || !schema.columns) {
    throw new Error('Cannot generate row: invalid schema');
  }

  const row = {};
  const ranges = schemaRanges || {};

  schema.columns.forEach(col => {
    if (col === schema.target) return;

    const range = ranges[col] || { min: 0, max: 100 };

    if (col === 'patient_id' || col === 'customer_id' || col === 'student_id' || col === 'station_id' || col === 'user_id' || col === 'id') {
      row[col] = `${col.split('_')[0]}_${String(index + 1).padStart(6, '0')}`;
    } else if (col === 'gender' || col === 'employment_status' || col === 'home_ownership' || col === 'loan_intent' || col === 'preferred_category' || col === 'content_type' || col === 'verified_status' || col === 'smoking_status' || col === 'bmi_category' || col === 'socioeconomic_status' || col === 'part_time_job' || col === 'extracurricular' || col === 'traffic_density' || col === 'industrial_proximity' || col === 'wind_direction' || col === 'parental_education' || col === 'family_history_diabetes') {
      row[col] = pickRandom(getCategoricalValues(col));
    } else if (typeof range.min === 'number' && typeof range.max === 'number') {
      row[col] = generateRealisticValue(col, range.min, range.max, domain);
    }
  });

  row[schema.target] = generateTarget(domain, row, schema.target);
  return row;
}

function generateRealisticValue(col, min, max, domain) {
  const value = min + Math.random() * (max - min);

  if (['credit_score', 'age', 'employment_years', 'num_open_accounts', 'derogatory_marks', 'loan_term_months', 'prior_gpa', 'midterm_score', 'final_exam_score', 'assignment_completion', 'participation_score', 'membership_years', 'days_since_last_purchase', 'customer_support_tickets', 'product_diversity', 'purchase_frequency', 'spending_score'].includes(col)) {
    return Math.round(value * 10) / 10;
  }
  if (['sleep_hours', 'study_hours_per_week', 'internet_usage_hours', 'avg_engagement_rate', 'posting_frequency_per_week', 'account_age_years'].includes(col)) {
    return Math.round(value * 100) / 100;
  }
  if (['hba1c', 'debt_to_income_ratio', 'co_ppm', 'return_rate', 'credit_card_utilization', 'promotion_response_rate', 'online_vs_offline_ratio', 'reels_percentage', 'hashtag_usage_rate', 'humidity_percent', 'attendance_percentage'].includes(col)) {
    return Math.round(value * 100) / 100;
  }
  if (['pm25_concentration', 'pm10_concentration', 'o3_ppb', 'no2_ppb', 'so2_ppb', 'wind_speed_kmh', 'precipitation_mm', 'temperature_celsius', 'air_quality_index', 'avg_likes_received', 'followers_count', 'following_count', 'posts_count', 'brand_partnerships', 'stories_per_week', 'average_order_value', 'annual_income', 'income_annual', 'loan_amount', 'debt_amount', 'waist_circumference'].includes(col)) {
    return Math.round(value * 100) / 100;
  }

  return Math.round(value);
}

function generateTarget(domain, row, target) {
  if (domain === 'medical') {
    const hba1c = row.hba1c || 5.5;
    const bmi = row.bmi || 25;
    const glucose = row.glucose_level || 100;
    const risk = (hba1c > 6.5 ? 2 : hba1c > 5.7 ? 1 : 0) + (bmi > 30 ? 1 : 0) + (glucose > 140 ? 1 : 0);
    if (risk >= 2 || Math.random() < 0.15) return 'diabetic';
    if (risk === 1 || (Math.random() >= 0.15 && Math.random() < 0.35)) return 'pre-diabetic';
    return 'healthy';
  }

  if (domain === 'financial') {
    const creditScore = row.credit_score || 600;
    const dti = row.debt_to_income_ratio || 0.3;
    const derogs = row.derogatory_marks || 0;
    const riskScore = (creditScore < 600 ? 3 : creditScore < 700 ? 1 : 0) + (dti > 0.4 ? 2 : dti > 0.3 ? 1 : 0) + (derogs > 0 ? 2 : 0);
    if (riskScore >= 3 || Math.random() < 0.2) return 'high';
    if (riskScore >= 1 || Math.random() < 0.4) return 'medium';
    return 'low';
  }

  if (domain === 'education') {
    const study = row.study_hours_per_week || 10;
    const attendance = row.attendance_percentage || 75;
    const priorGpa = row.prior_gpa || 3.0;
    const internet = row.internet_usage_hours || 5;
    const performance = (study * 3) + attendance + (priorGpa * 20) - (internet * 2);
    if (performance > 250 || Math.random() < 0.15) return Math.round((3.5 + Math.random() * 0.5) * 100) / 100;
    if (performance > 180 || Math.random() < 0.4) return Math.round((2.5 + Math.random() * 1.0) * 100) / 100;
    return Math.round((1.0 + Math.random() * 1.5) * 100) / 100;
  }

  if (domain === 'retail') {
    const daysSince = row.days_since_last_purchase || 30;
    const returnRate = row.return_rate || 5;
    const promo = row.promotion_response_rate || 50;
    const risk = (daysSince > 90 ? 3 : daysSince > 60 ? 2 : daysSince > 30 ? 1 : 0) + (returnRate > 20 ? 2 : returnRate > 10 ? 1 : 0) + (promo < 10 ? 1 : 0);
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
    const followers = row.followers_count || 1000;
    const engagement = row.avg_engagement_rate || 5;
    const score = Math.log10(followers + 1) * 20 + engagement * 2;
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
  const schema = options.schema || getRealisticSchema(domain);
  const rows = options.rows || [];
  const target = schema?.target || 'target';

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
    columns: schema?.columns || [],
    label_distribution: labelDist
  };
}

main();
