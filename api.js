#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function getSampleRows(domain) {
  const samples = {
    medical: [
      { age: 52, gender: 'male', glucose: 210.4, bmi: 34.5, hba1c: 9.2, blood_pressure: 140, activity_level: 'sedentary', family_history: true, outcome: 'diabetic' },
      { age: 33, gender: 'female', glucose: 102.3, bmi: 24.8, hba1c: 5.5, blood_pressure: 118, activity_level: 'moderate', family_history: false, outcome: 'healthy' },
      { age: 41, gender: 'male', glucose: 165.7, bmi: 29.3, hba1c: 7.1, blood_pressure: 130, activity_level: 'light', family_history: true, outcome: 'pre-diabetic' },
      { age: 55, gender: 'female', glucose: 185.0, bmi: 32.0, hba1c: 8.5, blood_pressure: 145, activity_level: 'sedentary', family_history: true, outcome: 'diabetic' },
      { age: 28, gender: 'male', glucose: 95.0, bmi: 22.0, hba1c: 5.0, blood_pressure: 115, activity_level: 'active', family_history: false, outcome: 'healthy' },
      { age: 48, gender: 'female', glucose: 140.0, bmi: 28.0, hba1c: 6.2, blood_pressure: 125, activity_level: 'light', family_history: true, outcome: 'pre-diabetic' },
      { age: 62, gender: 'male', glucose: 230.0, bmi: 36.0, hba1c: 10.0, blood_pressure: 155, activity_level: 'sedentary', family_history: true, outcome: 'diabetic' },
      { age: 35, gender: 'female', glucose: 110.0, bmi: 26.0, hba1c: 5.8, blood_pressure: 120, activity_level: 'moderate', family_history: false, outcome: 'healthy' }
    ],
    financial: [
      { age: 45, income: 55000, credit_score: 620, loan_amount: 200000, debt_ratio: 0.45, employment_status: 'employed', default_risk: 'high' },
      { age: 29, income: 75000, credit_score: 720, loan_amount: 150000, debt_ratio: 0.25, employment_status: 'employed', default_risk: 'low' },
      { age: 38, income: 40000, credit_score: 580, loan_amount: 250000, debt_ratio: 0.60, employment_status: 'self-employed', default_risk: 'high' },
      { age: 52, income: 85000, credit_score: 780, loan_amount: 300000, debt_ratio: 0.20, employment_status: 'employed', default_risk: 'low' },
      { age: 25, income: 35000, credit_score: 650, loan_amount: 100000, debt_ratio: 0.35, employment_status: 'employed', default_risk: 'medium' },
      { age: 42, income: 62000, credit_score: 700, loan_amount: 180000, debt_ratio: 0.30, employment_status: 'employed', default_risk: 'low' },
      { age: 55, income: 95000, credit_score: 800, loan_amount: 400000, debt_ratio: 0.15, employment_status: 'employed', default_risk: 'low' },
      { age: 33, income: 45000, credit_score: 590, loan_amount: 220000, debt_ratio: 0.55, employment_status: 'self-employed', default_risk: 'high' }
    ],
    education: [
      { age: 18, study_hours: 2.5, attendance: 65, sleep_hours: 6.0, internet_usage: 4.2, gpa: 5.8 },
      { age: 20, study_hours: 5.0, attendance: 85, sleep_hours: 7.2, internet_usage: 2.0, gpa: 7.6 },
      { age: 19, study_hours: 1.8, attendance: 55, sleep_hours: 5.5, internet_usage: 5.5, gpa: 4.9 },
      { age: 21, study_hours: 6.5, attendance: 92, sleep_hours: 7.0, internet_usage: 1.5, gpa: 8.5 },
      { age: 20, study_hours: 3.5, attendance: 75, sleep_hours: 6.5, internet_usage: 3.0, gpa: 6.5 },
      { age: 19, study_hours: 4.2, attendance: 80, sleep_hours: 6.8, internet_usage: 2.5, gpa: 7.2 },
      { age: 22, study_hours: 7.0, attendance: 95, sleep_hours: 6.0, internet_usage: 1.0, gpa: 9.0 },
      { age: 18, study_hours: 2.0, attendance: 50, sleep_hours: 5.0, internet_usage: 6.0, gpa: 4.0 }
    ],
    retail: [
      { age: 35, income_bracket: 'middle', purchase_frequency: 15, average_order_value: 85.50, total_lifetime_value: 8500, product_categories: 'electronics', preferred_channel: 'online', promotion_sensitivity: 'medium', churn_risk: 'low' },
      { age: 28, income_bracket: 'upper-middle', purchase_frequency: 25, average_order_value: 150.00, total_lifetime_value: 15000, product_categories: 'clothing', preferred_channel: 'both', promotion_sensitivity: 'high', churn_risk: 'low' },
      { age: 45, income_bracket: 'low', purchase_frequency: 3, average_order_value: 45.00, total_lifetime_value: 500, product_categories: 'food', preferred_channel: 'in-store', promotion_sensitivity: 'low', churn_risk: 'high' },
      { age: 32, income_bracket: 'high', purchase_frequency: 30, average_order_value: 200.00, total_lifetime_value: 25000, product_categories: 'electronics', preferred_channel: 'online', promotion_sensitivity: 'low', churn_risk: 'low' },
      { age: 40, income_bracket: 'middle', purchase_frequency: 8, average_order_value: 75.00, total_lifetime_value: 3200, product_categories: 'home', preferred_channel: 'both', promotion_sensitivity: 'medium', churn_risk: 'medium' },
      { age: 25, income_bracket: 'upper-middle', purchase_frequency: 20, average_order_value: 120.00, total_lifetime_value: 12000, product_categories: 'beauty', preferred_channel: 'online', promotion_sensitivity: 'high', churn_risk: 'low' },
      { age: 55, income_bracket: 'high', purchase_frequency: 35, average_order_value: 250.00, total_lifetime_value: 40000, product_categories: 'electronics', preferred_channel: 'both', promotion_sensitivity: 'low', churn_risk: 'low' },
      { age: 30, income_bracket: 'low', purchase_frequency: 2, average_order_value: 35.00, total_lifetime_value: 400, product_categories: 'food', preferred_channel: 'in-store', promotion_sensitivity: 'medium', churn_risk: 'high' }
    ],
    environmental: [
      { temperature: 28.5, humidity: 75, air_quality_index: 120, pm25: 45.2, pm10: 80.5, no2: 35.0, o3: 60.0, traffic_density: 'medium', industrial_proximity: false, wind_speed: 12.0, health_risk: 'moderate' },
      { temperature: 35.0, humidity: 85, air_quality_index: 180, pm25: 95.0, pm10: 150.0, no2: 55.0, o3: 85.0, traffic_density: 'high', industrial_proximity: true, wind_speed: 3.5, health_risk: 'high' },
      { temperature: 22.0, humidity: 50, air_quality_index: 45, pm25: 15.0, pm10: 30.0, no2: 15.0, o3: 25.0, traffic_density: 'low', industrial_proximity: false, wind_speed: 20.0, health_risk: 'low' },
      { temperature: 30.0, humidity: 65, air_quality_index: 95, pm25: 35.0, pm10: 60.0, no2: 28.0, o3: 45.0, traffic_density: 'medium', industrial_proximity: false, wind_speed: 15.0, health_risk: 'low' },
      { temperature: 38.0, humidity: 90, air_quality_index: 220, pm25: 120.0, pm10: 180.0, no2: 65.0, o3: 95.0, traffic_density: 'very_high', industrial_proximity: true, wind_speed: 2.0, health_risk: 'very_high' },
      { temperature: 25.0, humidity: 55, air_quality_index: 55, pm25: 20.0, pm10: 40.0, no2: 18.0, o3: 30.0, traffic_density: 'low', industrial_proximity: false, wind_speed: 18.0, health_risk: 'low' },
      { temperature: 32.0, humidity: 70, air_quality_index: 110, pm25: 50.0, pm10: 85.0, no2: 40.0, o3: 55.0, traffic_density: 'high', industrial_proximity: true, wind_speed: 8.0, health_risk: 'moderate' },
      { temperature: 20.0, humidity: 45, air_quality_index: 35, pm25: 10.0, pm10: 20.0, no2: 10.0, o3: 20.0, traffic_density: 'low', industrial_proximity: false, wind_speed: 25.0, health_risk: 'low' }
    ],
    social: [
      { age: 28, followers: 150000, following: 500, posts_per_week: 5.0, engagement_rate: 8.5, account_age_years: 3.5, verified: true, content_type: 'video', posting_time: 'evening', influence_score: 78 },
      { age: 35, followers: 25000, following: 300, posts_per_week: 2.0, engagement_rate: 12.0, account_age_years: 1.5, verified: false, content_type: 'image', posting_time: 'afternoon', influence_score: 45 },
      { age: 22, followers: 500000, following: 800, posts_per_week: 15.0, engagement_rate: 3.5, account_age_years: 5.0, verified: true, content_type: 'mixed', posting_time: 'night', influence_score: 82 },
      { age: 40, followers: 80000, following: 200, posts_per_week: 3.0, engagement_rate: 10.0, account_age_years: 4.0, verified: true, content_type: 'video', posting_time: 'morning', influence_score: 65 },
      { age: 25, followers: 5000, following: 150, posts_per_week: 1.0, engagement_rate: 15.0, account_age_years: 0.5, verified: false, content_type: 'image', posting_time: 'evening', influence_score: 25 },
      { age: 30, followers: 200000, following: 600, posts_per_week: 8.0, engagement_rate: 6.0, account_age_years: 3.0, verified: true, content_type: 'mixed', posting_time: 'afternoon', influence_score: 72 },
      { age: 18, followers: 1000, following: 100, posts_per_week: 0.5, engagement_rate: 20.0, account_age_years: 0.2, verified: false, content_type: 'image', posting_time: 'night', influence_score: 15 },
      { age: 45, followers: 300000, following: 400, posts_per_week: 4.0, engagement_rate: 7.0, account_age_years: 6.0, verified: true, content_type: 'video', posting_time: 'evening', influence_score: 85 }
    ],
    other: [
      { id: 1, value_1: 250.5, value_2: 180.3, category: 'A', flag: true, score: 85 },
      { id: 2, value_1: 120.0, value_2: 95.8, category: 'B', flag: false, score: 62 },
      { id: 3, value_1: 380.2, value_2: 420.1, category: 'C', flag: true, score: 78 },
      { id: 4, value_1: 95.0, value_2: 150.0, category: 'A', flag: true, score: 72 },
      { id: 5, value_1: 450.0, value_2: 280.0, category: 'D', flag: false, score: 90 },
      { id: 6, value_1: 180.0, value_2: 200.0, category: 'B', flag: true, score: 68 },
      { id: 7, value_1: 320.0, value_2: 350.0, category: 'C', flag: false, score: 80 },
      { id: 8, value_1: 150.0, value_2: 100.0, category: 'A', flag: true, score: 55 }
    ]
  };
  return samples[domain] || samples.other;
}

function detectDomain(topic) {
  const topicLower = topic.toLowerCase();
  if (topicLower.includes('diabetes') || topicLower.includes('health') || topicLower.includes('medical') || topicLower.includes('patient') || topicLower.includes('disease') || topicLower.includes('heart')) return 'medical';
  if (topicLower.includes('loan') || topicLower.includes('credit') || topicLower.includes('fraud') || topicLower.includes('financial')) return 'financial';
  if (topicLower.includes('student') || topicLower.includes('education') || topicLower.includes('school') || topicLower.includes('grade')) return 'education';
  if (topicLower.includes('retail') || topicLower.includes('customer') || topicLower.includes('sales') || topicLower.includes('churn')) return 'retail';
  if (topicLower.includes('pollution') || topicLower.includes('climate') || topicLower.includes('environmental') || topicLower.includes('air')) return 'environmental';
  if (topicLower.includes('social') || topicLower.includes('twitter') || topicLower.includes('instagram') || topicLower.includes('influencer')) return 'social';
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

function generateRows(domain, size, seed) {
  const samples = getSampleRows(domain);
  const rows = [];
  for (let i = 0; i < size; i++) {
    rows.push({ ...samples[i % samples.length] });
  }
  return rows;
}

function toCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  rows.forEach(row => {
    const values = headers.map(h => {
      const val = row[h];
      if (typeof val === 'string') return val;
      if (typeof val === 'boolean') return val ? 'true' : 'false';
      if (typeof val === 'number') {
        if (Number.isInteger(val)) return val.toString();
        return val.toFixed(2);
      }
      return val;
    });
    lines.push(values.join(','));
  });
  return lines.join('\n');
}

function toJsonl(rows) {
  return rows.map(row => JSON.stringify(row)).join('\n');
}

function getLabelDistribution(rows, targetColumn) {
  const dist = {};
  rows.forEach(row => {
    const label = row[targetColumn];
    const key = typeof label === 'number' ? label.toString() : label;
    dist[key] = (dist[key] || 0) + 1;
  });
  return dist;
}

function processRequest(input) {
  const topic = input.topic;
  const size = input.size || 500;
  const format = input.format || 'json';
  const seed = input.seed || 42;
  const balanced = input.balanced || false;

  const domain = detectDomain(topic);
  const subdomain = formatSubdomain(topic);
  const taskType = getTaskType(domain);
  const targetColumn = getTarget(domain);

  const rows = generateRows(domain, size, seed);

  let records;
  if (format === 'json') {
    records = rows;
  } else if (format === 'csv') {
    records = toCsv(rows);
  } else if (format === 'jsonl') {
    records = toJsonl(rows);
  } else {
    records = rows;
  }

  const labelDistribution = getLabelDistribution(rows, targetColumn);

  return {
    success: true,
    data: {
      dataset_name: `${subdomain}_dataset`,
      format: format,
      records: records,
      row_count: rows.length
    },
    meta: {
      domain: domain,
      subdomain: subdomain,
      task_type: taskType,
      target_column: targetColumn,
      seed: seed,
      label_distribution: labelDistribution
    },
    errors: null
  };
}

const input = JSON.parse(process.argv[2] || '{}');
const result = processRequest(input);
console.log(JSON.stringify(result));
