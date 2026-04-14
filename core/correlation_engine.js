/**
 * CODOZ Correlation Engine
 * 
 * Implements feature correlation for realistic data generation.
 * Ensures features have medically/statistically appropriate relationships.
 */

const CORRELATION_RULES = {
  
  // Medical correlations
  heart_disease: [
    { features: ['age', 'serum_cholesterol'], type: 'positive', strength: 0.3, description: 'Older patients tend to have higher cholesterol' },
    { features: ['age', 'resting_blood_pressure'], type: 'positive', strength: 0.4, description: 'Blood pressure increases with age' },
    { features: ['age', 'maximum_heart_rate'], type: 'negative', strength: -0.4, description: 'Max heart rate decreases with age' },
    { features: ['serum_cholesterol', 'resting_blood_pressure'], type: 'positive', strength: 0.25, description: 'High cholesterol often accompanies high BP' },
    { features: ['resting_blood_pressure', 'exercise_induced_angina'], type: 'positive', strength: 0.3, description: 'High BP increases angina risk' }
  ],
  
  diabetes: [
    { features: ['age', 'glucose_concentration'], type: 'positive', strength: 0.25, description: 'Glucose tends to increase with age' },
    { features: ['age', 'bmi'], type: 'positive', strength: 0.2, description: 'BMI tends to increase with age' },
    { features: ['bmi', 'glucose_concentration'], type: 'positive', strength: 0.3, description: 'Obesity is linked to higher glucose' },
    { features: ['bmi', 'blood_pressure_systolic'], type: 'positive', strength: 0.35, description: 'Higher BMI correlates with higher BP' },
    { features: ['insulin_level', 'glucose_concentration'], type: 'positive', strength: 0.4, description: 'Insulin and glucose are related' }
  ],
  
  customer_churn: [
    { features: ['tenure_months', 'monthly_charges'], type: 'positive', strength: 0.5, description: 'Longer tenure often means higher charges' },
    { features: ['tenure_months', 'total_charges'], type: 'positive', strength: 0.9, description: 'Strong correlation between tenure and total spend' },
    { features: ['customer_age', 'tenure_months'], type: 'positive', strength: 0.2, description: 'Older customers may have longer tenure' },
    { features: ['monthly_charges', 'internet_service'], type: 'positive', strength: 0.6, description: 'Fiber optic costs more' }
  ],
  
  employee_attrition: [
    { features: ['age', 'years_at_company'], type: 'positive', strength: 0.5, description: 'Older employees stay longer' },
    { features: ['years_at_company', 'monthly_income'], type: 'positive', strength: 0.4, description: 'Longer tenure = higher pay' },
    { features: ['job_satisfaction', 'performance_rating'], type: 'positive', strength: 0.35, description: 'Satisfaction affects performance' },
    { features: ['total_working_years', 'job_level'], type: 'positive', strength: 0.45, description: 'More experience = higher level' },
    { features: ['distance_from_home', 'attrition'], type: 'positive', strength: 0.25, description: 'Longer commute = higher attrition risk' }
  ],
  
  loan_default: [
    { features: ['applicant_age', 'employment_length'], type: 'positive', strength: 0.5, description: 'Older = longer employment' },
    { features: ['credit_score', 'loan_amount'], type: 'positive', strength: 0.3, description: 'Higher score = larger loans' },
    { features: ['credit_score', 'loan_interest_rate'], type: 'negative', strength: 0.5, description: 'Higher score = lower rate' },
    { features: ['employment_length', 'annual_income'], type: 'positive', strength: 0.4, description: 'More experience = higher income' }
  ]
};

/**
 * Apply correlations to a set of generated features
 */
function applyCorrelations(features, topicKey, rand) {
  const correlations = CORRELATION_RULES[topicKey];
  if (!correlations) return features;
  
  // Create a working copy
  const correlatedFeatures = { ...features };
  
  for (const rule of correlations) {
    const [feature1, feature2] = rule.features;
    
    if (correlatedFeatures[feature1] === undefined || correlatedFeatures[feature2] === undefined) {
      continue;
    }
    
    const val1 = correlatedFeatures[feature1];
    const val2 = correlatedFeatures[feature2];
    
    if (typeof val1 !== 'number' || typeof val2 !== 'number') continue;
    
    // Calculate correlation adjustment
    const adjustment = calculateCorrelationAdjustment(val1, val2, rule);
    
    // Apply adjustment to second feature
    correlatedFeatures[feature2] = val2 + adjustment;
    
    // Clamp to reasonable ranges (we'll rely on validation later)
  }
  
  return correlatedFeatures;
}

/**
 * Calculate correlation-based adjustment between two features
 */
function calculateCorrelationAdjustment(value1, value2, rule) {
  // Normalize values to 0-1 range based on typical ranges
  const normalized1 = normalizeValue(value1, rule.features[0]);
  
  // Calculate expected offset for feature2 based on correlation
  const range2 = getFeatureRange(rule.features[1]);
  const expectedOffset = normalized1 * rule.strength * (range2.max - range2.min) * 0.3;
  
  // Apply with some randomness (not 100% deterministic)
  const direction = rule.type === 'positive' ? 1 : -1;
  
  return expectedOffset * direction;
}

function normalizeValue(value, featureName) {
  const range = getFeatureRange(featureName);
  const mid = (range.max + range.min) / 2;
  const halfRange = (range.max - range.min) / 2;
  
  return (value - mid) / halfRange; // Returns -1 to 1
}

function getFeatureRange(featureName) {
  const ranges = {
    age: { min: 18, max: 85 },
    serum_cholesterol: { min: 120, max: 564 },
    resting_blood_pressure: { min: 94, max: 200 },
    maximum_heart_rate: { min: 71, max: 202 },
    glucose_concentration: { min: 44, max: 199 },
    bmi: { min: 15, max: 67 },
    blood_pressure_systolic: { min: 60, max: 180 },
    insulin_level: { min: 0, max: 846 },
    tenure_months: { min: 0, max: 72 },
    monthly_charges: { min: 18, max: 119 },
    total_charges: { min: 0, max: 9500 },
    customer_age: { min: 18, max: 80 },
    monthly_income: { min: 1000, max: 20000 },
    employment_length: { min: 0, max: 41 },
    years_at_company: { min: 0, max: 40 },
    credit_score: { min: 300, max: 850 },
    loan_amount: { min: 500, max: 40000 }
  };
  
  return ranges[featureName] || { min: 0, max: 100 };
}

module.exports = {
  CORRELATION_RULES,
  applyCorrelations,
  calculateCorrelationAdjustment
};
