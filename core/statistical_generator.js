/**
 * CODOZ Statistical Generator
 * 
 * Fallback generator for topics without clinical rules.
 * Uses statistical distributions and correlation-aware generation.
 */

const ENTITY_GENERATORS = {
  
  patient: {
    baseFeatures: {
      age: { type: 'int', range: [18, 85], distribution: 'normal', mean: 45, stdDev: 15 },
      gender: { type: 'categorical', categories: ['Male', 'Female'], weights: [0.5, 0.5] },
      blood_pressure_systolic: { type: 'int', range: [90, 200], distribution: 'normal', mean: 120, stdDev: 15 },
      blood_pressure_diastolic: { type: 'int', range: [60, 130], distribution: 'normal', mean: 80, stdDev: 10 },
      heart_rate: { type: 'int', range: [50, 120], distribution: 'normal', mean: 72, stdDev: 10 },
      temperature: { type: 'float', range: [36.0, 38.5], distribution: 'normal', mean: 37.0, stdDev: 0.5 },
      weight_kg: { type: 'float', range: [40, 150], distribution: 'normal', mean: 75, stdDev: 15 },
      height_cm: { type: 'int', range: [150, 200], distribution: 'normal', mean: 170, stdDev: 10 }
    },
    correlations: [
      { feature: 'age', affects: 'blood_pressure_systolic', type: 'positive', strength: 0.4 },
      { feature: 'age', affects: 'blood_pressure_diastolic', type: 'positive', strength: 0.3 },
      { feature: 'age', affects: 'heart_rate', type: 'negative', strength: -0.2 },
      { feature: 'weight_kg', affects: 'blood_pressure_systolic', type: 'positive', strength: 0.3 }
    ]
  },
  
  customer: {
    baseFeatures: {
      age: { type: 'int', range: [18, 80], distribution: 'normal', mean: 40, stdDev: 15 },
      gender: { type: 'categorical', categories: ['Male', 'Female'], weights: [0.5, 0.5] },
      income: { type: 'int', range: [20000, 200000], distribution: 'lognormal', mean: 50000, stdDev: 0.5 },
      credit_score: { type: 'int', range: [300, 850], distribution: 'normal', mean: 680, stdDev: 80 },
      tenure_months: { type: 'int', range: [0, 120], distribution: 'exponential', mean: 24 }
    },
    correlations: [
      { feature: 'age', affects: 'income', type: 'positive', strength: 0.3 },
      { feature: 'age', affects: 'credit_score', type: 'positive', strength: 0.4 },
      { feature: 'tenure_months', affects: 'income', type: 'positive', strength: 0.2 }
    ]
  },
  
  employee: {
    baseFeatures: {
      age: { type: 'int', range: [22, 70], distribution: 'normal', mean: 35, stdDev: 10 },
      gender: { type: 'categorical', categories: ['Male', 'Female'], weights: [0.5, 0.5] },
      years_experience: { type: 'int', range: [0, 40], distribution: 'normal', mean: 8, stdDev: 6 },
      salary: { type: 'int', range: [30000, 200000], distribution: 'lognormal', mean: 60000, stdDev: 0.4 },
      performance_score: { type: 'float', range: [1.0, 5.0], distribution: 'normal', mean: 3.5, stdDev: 0.5 },
      satisfaction_score: { type: 'float', range: [1.0, 5.0], distribution: 'normal', mean: 3.5, stdDev: 0.6 }
    },
    correlations: [
      { feature: 'age', affects: 'years_experience', type: 'positive', strength: 0.6 },
      { feature: 'years_experience', affects: 'salary', type: 'positive', strength: 0.5 },
      { feature: 'performance_score', affects: 'satisfaction_score', type: 'positive', strength: 0.3 }
    ]
  },
  
  transaction: {
    baseFeatures: {
      amount: { type: 'float', range: [1, 10000], distribution: 'lognormal', mean: 100, stdDev: 1.0 },
      quantity: { type: 'int', range: [1, 50], distribution: 'poisson', mean: 3 },
      price_per_unit: { type: 'float', range: [0.5, 500], distribution: 'lognormal', mean: 25, stdDev: 1.2 },
      discount_percent: { type: 'float', range: [0, 50], distribution: 'exponential', mean: 5 }
    },
    correlations: [
      { feature: 'quantity', affects: 'amount', type: 'positive', strength: 0.8 },
      { feature: 'quantity', affects: 'discount_percent', type: 'positive', strength: 0.3 }
    ]
  },
  
  student: {
    baseFeatures: {
      age: { type: 'int', range: [15, 30], distribution: 'normal', mean: 20, stdDev: 3 },
      gender: { type: 'categorical', categories: ['Male', 'Female'], weights: [0.5, 0.5] },
      gpa: { type: 'float', range: [0.0, 4.0], distribution: 'normal', mean: 3.0, stdDev: 0.5 },
      attendance_rate: { type: 'int', range: [50, 100], distribution: 'normal', mean: 85, stdDev: 10 },
      study_hours_per_week: { type: 'int', range: [0, 40], distribution: 'normal', mean: 15, stdDev: 8 }
    },
    correlations: [
      { feature: 'study_hours_per_week', affects: 'gpa', type: 'positive', strength: 0.5 },
      { feature: 'attendance_rate', affects: 'gpa', type: 'positive', strength: 0.4 }
    ]
  },
  
  machine: {
    baseFeatures: {
      age_years: { type: 'float', range: [0, 20], distribution: 'normal', mean: 5, stdDev: 4 },
      temperature: { type: 'float', range: [20, 100], distribution: 'normal', mean: 50, stdDev: 15 },
      vibration: { type: 'float', range: [0, 10], distribution: 'normal', mean: 2, stdDev: 1.5 },
      pressure: { type: 'float', range: [90, 120], distribution: 'normal', mean: 101, stdDev: 5 },
      power_consumption: { type: 'float', range: [0, 100], distribution: 'normal', mean: 50, stdDev: 20 },
      operating_hours: { type: 'int', range: [0, 8760], distribution: 'normal', mean: 2000, stdDev: 1500 }
    },
    correlations: [
      { feature: 'age_years', affects: 'vibration', type: 'positive', strength: 0.4 },
      { feature: 'operating_hours', affects: 'temperature', type: 'positive', strength: 0.3 },
      { feature: 'age_years', affects: 'power_consumption', type: 'positive', strength: 0.3 }
    ]
  },
  
  sensor: {
    baseFeatures: {
      temperature: { type: 'float', range: [-20, 50], distribution: 'normal', mean: 22, stdDev: 10 },
      humidity: { type: 'float', range: [0, 100], distribution: 'normal', mean: 50, stdDev: 20 },
      pressure: { type: 'float', range: [980, 1050], distribution: 'normal', mean: 1013, stdDev: 10 },
      light_level: { type: 'int', range: [0, 1000], distribution: 'normal', mean: 400, stdDev: 200 },
      noise_level: { type: 'float', range: [30, 100], distribution: 'normal', mean: 50, stdDev: 15 }
    },
    correlations: [
      { feature: 'temperature', affects: 'humidity', type: 'negative', strength: -0.3 }
    ]
  },
  
  record: {
    baseFeatures: {
      value_1: { type: 'float', range: [0, 100], distribution: 'normal', mean: 50, stdDev: 20 },
      value_2: { type: 'float', range: [0, 100], distribution: 'normal', mean: 50, stdDev: 20 },
      score: { type: 'float', range: [0, 100], distribution: 'normal', mean: 70, stdDev: 15 },
      count: { type: 'int', range: [0, 1000], distribution: 'lognormal', mean: 50, stdDev: 1.0 }
    },
    correlations: [
      { feature: 'value_1', affects: 'score', type: 'positive', strength: 0.4 },
      { feature: 'value_2', affects: 'score', type: 'positive', strength: 0.4 }
    ]
  }
};

function getEntityGenerator(entity) {
  return ENTITY_GENERATORS[entity] || ENTITY_GENERATORS.record;
}

function generateStatisticalFeature(featureConfig, rand, correlatedValues = {}) {
  const { type, range, distribution, mean, stdDev } = featureConfig;
  
  let value;
  
  switch (distribution) {
    case 'normal':
      value = mean + rand() * stdDev * 2 - stdDev;
      break;
    case 'lognormal':
      value = mean * Math.exp((rand() - 0.5) * stdDev * 2);
      break;
    case 'exponential':
      value = -mean * Math.log(1 - rand());
      break;
    case 'poisson':
      value = Math.round(mean * Math.exp((rand() - 0.5)));
      break;
    default:
      value = range[0] + rand() * (range[1] - range[0]);
  }
  
  // Apply correlation adjustments
  for (const [affects, adjustment] of Object.entries(correlatedValues)) {
    if (affects === type) {
      value += adjustment;
    }
  }
  
  // Clamp to range
  value = Math.max(range[0], Math.min(range[1], value));
  
  if (type === 'int' || type === 'integer') {
    return Math.round(value);
  }
  
  return parseFloat(value.toFixed(2));
}

function generateCorrelatedValue(baseValue, correlation, strength, range) {
  const adjustment = correlation * strength * (range[1] - range[0]) * 0.2;
  return adjustment;
}

module.exports = {
  ENTITY_GENERATORS,
  getEntityGenerator,
  generateStatisticalFeature,
  generateCorrelatedValue
};
