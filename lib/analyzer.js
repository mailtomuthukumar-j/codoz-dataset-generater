const DOMAIN_SCHEMAS = {
  diabetes: {
    domain: 'medical',
    columns: [
      { name: 'pregnancies', type: 'integer', range: [0, 20], distribution: 'normal' },
      { name: 'glucose', type: 'integer', range: [50, 200], distribution: 'normal' },
      { name: 'blood_pressure', type: 'integer', range: [40, 140], distribution: 'normal' },
      { name: 'skin_thickness', type: 'integer', range: [0, 60], distribution: 'normal' },
      { name: 'insulin', type: 'integer', range: [0, 400], distribution: 'normal' },
      { name: 'bmi', type: 'float', range: [15, 50], distribution: 'normal' },
      { name: 'diabetes_pedigree', type: 'float', range: [0.1, 2.5], distribution: 'normal' },
      { name: 'age', type: 'integer', range: [20, 80], distribution: 'normal' },
      { name: 'outcome', type: 'binary', range: [0, 1], distribution: 'biased' }
    ],
    correlations: { glucose: ['bmi', 'insulin'], age: ['pregnancies'] }
  },
  heart_disease: {
    domain: 'medical',
    columns: [
      { name: 'age', type: 'integer', range: [25, 80], distribution: 'normal' },
      { name: 'sex', type: 'categorical', values: ['male', 'female'], weights: [0.7, 0.3] },
      { name: 'cp', type: 'categorical', values: [0, 1, 2, 3], labels: ['typical', 'atypical', 'nonanginal', 'asymptomatic'] },
      { name: 'trestbps', type: 'integer', range: [90, 200], distribution: 'normal' },
      { name: 'chol', type: 'integer', range: [120, 400], distribution: 'normal' },
      { name: 'fbs', type: 'categorical', values: [0, 1], weights: [0.8, 0.2] },
      { name: 'restecg', type: 'categorical', values: [0, 1, 2] },
      { name: 'thalach', type: 'integer', range: [70, 200], distribution: 'normal' },
      { name: 'exang', type: 'categorical', values: [0, 1], weights: [0.6, 0.4] },
      { name: 'oldpeak', type: 'float', range: [0, 6], distribution: 'normal' },
      { name: 'slope', type: 'categorical', values: [0, 1, 2] },
      { name: 'ca', type: 'categorical', values: [0, 1, 2, 3] },
      { name: 'thal', type: 'categorical', values: [0, 1, 2, 3] },
      { name: 'target', type: 'binary', range: [0, 1], distribution: 'biased' }
    ],
    correlations: { age: ['trestbps', 'chol'], thalach: ['target'] }
  },
  loan_default: {
    domain: 'financial',
    columns: [
      { name: 'loan_id', type: 'id', prefix: 'LOAN' },
      { name: 'gender', type: 'categorical', values: ['Male', 'Female'], weights: [0.7, 0.3] },
      { name: 'married', type: 'categorical', values: ['Yes', 'No'], weights: [0.6, 0.4] },
      { name: 'dependents', type: 'categorical', values: ['0', '1', '2', '3+'], weights: [0.4, 0.3, 0.2, 0.1] },
      { name: 'education', type: 'categorical', values: ['Graduate', 'Not Graduate'], weights: [0.7, 0.3] },
      { name: 'self_employed', type: 'categorical', values: ['Yes', 'No'], weights: [0.15, 0.85] },
      { name: 'applicant_income', type: 'integer', range: [1500, 50000], distribution: 'skewed' },
      { name: 'coapplicant_income', type: 'float', range: [0, 20000], distribution: 'skewed' },
      { name: 'loan_amount', type: 'integer', range: [9, 600], distribution: 'normal' },
      { name: 'loan_term', type: 'categorical', values: [360, 180, 120, 84], weights: [0.6, 0.2, 0.15, 0.05] },
      { name: 'credit_history', type: 'categorical', values: [1, 0], weights: [0.7, 0.3] },
      { name: 'property_area', type: 'categorical', values: ['Urban', 'Semiurban', 'Rural'], weights: [0.35, 0.35, 0.3] },
      { name: 'loan_status', type: 'binary', range: [0, 1], distribution: 'biased' }
    ],
    correlations: { loan_amount: ['applicant_income'], credit_history: ['loan_status'] }
  },
  customer_churn: {
    domain: 'retail',
    columns: [
      { name: 'customer_id', type: 'id', prefix: 'CUST' },
      { name: 'gender', type: 'categorical', values: ['Male', 'Female'], weights: [0.5, 0.5] },
      { name: 'senior_citizen', type: 'categorical', values: [0, 1], weights: [0.8, 0.2] },
      { name: 'partner', type: 'categorical', values: ['Yes', 'No'], weights: [0.5, 0.5] },
      { name: 'dependents', type: 'categorical', values: ['Yes', 'No'], weights: [0.3, 0.7] },
      { name: 'tenure', type: 'integer', range: [0, 72], distribution: 'normal' },
      { name: 'phone_service', type: 'categorical', values: ['Yes', 'No'], weights: [0.9, 0.1] },
      { name: 'multiple_lines', type: 'categorical', values: ['Yes', 'No', 'No phone service'], weights: [0.4, 0.5, 0.1] },
      { name: 'internet_service', type: 'categorical', values: ['Fiber optic', 'DSL', 'No'], weights: [0.45, 0.35, 0.2] },
      { name: 'online_security', type: 'categorical', values: ['Yes', 'No', 'No internet'], weights: [0.3, 0.5, 0.2] },
      { name: 'online_backup', type: 'categorical', values: ['Yes', 'No', 'No internet'], weights: [0.3, 0.5, 0.2] },
      { name: 'tech_support', type: 'categorical', values: ['Yes', 'No', 'No internet'], weights: [0.3, 0.5, 0.2] },
      { name: 'streaming_tv', type: 'categorical', values: ['Yes', 'No', 'No internet'], weights: [0.35, 0.45, 0.2] },
      { name: 'streaming_movies', type: 'categorical', values: ['Yes', 'No', 'No internet'], weights: [0.35, 0.45, 0.2] },
      { name: 'contract', type: 'categorical', values: ['Month-to-month', 'One year', 'Two year'], weights: [0.5, 0.3, 0.2] },
      { name: 'paperless_billing', type: 'categorical', values: ['Yes', 'No'], weights: [0.6, 0.4] },
      { name: 'payment_method', type: 'categorical', values: ['Electronic check', 'Mailed check', 'Bank transfer', 'Credit card'], weights: [0.35, 0.2, 0.25, 0.2] },
      { name: 'monthly_charges', type: 'float', range: [18, 250], distribution: 'normal' },
      { name: 'total_charges', type: 'float', range: [18, 9000], distribution: 'normal' },
      { name: 'churn', type: 'binary', range: [0, 1], distribution: 'biased' }
    ],
    correlations: { tenure: ['total_charges', 'churn'], monthly_charges: ['internet_service'] }
  },
  student_performance: {
    domain: 'education',
    columns: [
      { name: 'student_id', type: 'id', prefix: 'STU' },
      { name: 'gender', type: 'categorical', values: ['female', 'male'], weights: [0.5, 0.5] },
      { name: 'race_ethnicity', type: 'categorical', values: ['group A', 'group B', 'group C', 'group D', 'group E'], weights: [0.1, 0.2, 0.35, 0.25, 0.1] },
      { name: 'parental_level_of_education', type: 'categorical', values: ["bachelor's degree", "some college", "master's degree", "associate's degree", "high school", "some high school"], weights: [0.1, 0.2, 0.1, 0.25, 0.25, 0.1] },
      { name: 'lunch', type: 'categorical', values: ['standard', 'free/reduced'], weights: [0.6, 0.4] },
      { name: 'test_preparation_course', type: 'categorical', values: ['none', 'completed'], weights: [0.65, 0.35] },
      { name: 'math_score', type: 'integer', range: [0, 100], distribution: 'normal' },
      { name: 'reading_score', type: 'integer', range: [0, 100], distribution: 'normal' },
      { name: 'writing_score', type: 'integer', range: [0, 100], distribution: 'normal' }
    ],
    correlations: { math_score: ['reading_score', 'writing_score'] }
  },
  air_quality: {
    domain: 'environmental',
    columns: [
      { name: 'id', type: 'id', prefix: 'AQ' },
      { name: 'date', type: 'date', range: ['2020-01-01', '2024-12-31'] },
      { name: 'co', type: 'float', range: [0, 10], distribution: 'normal' },
      { name: 'no', type: 'float', range: [0, 200], distribution: 'normal' },
      { name: 'no2', type: 'float', range: [0, 100], distribution: 'normal' },
      { name: 'o3', type: 'float', range: [0, 200], distribution: 'normal' },
      { name: 'so2', type: 'float', range: [0, 50], distribution: 'normal' },
      { name: 'pm2_5', type: 'float', range: [0, 200], distribution: 'skewed' },
      { name: 'pm10', type: 'float', range: [0, 300], distribution: 'skewed' },
      { name: 'nh3', type: 'float', range: [0, 50], distribution: 'normal' },
      { name: 'aqi', type: 'integer', range: [0, 500], distribution: 'normal' }
    ],
    correlations: { pm2_5: ['pm10', 'aqi'], no: ['no2'] }
  },
  default: {
    domain: 'other',
    columns: [
      { name: 'id', type: 'id', prefix: 'REC' },
      { name: 'feature_1', type: 'float', range: [0, 100], distribution: 'normal' },
      { name: 'feature_2', type: 'float', range: [0, 100], distribution: 'normal' },
      { name: 'feature_3', type: 'float', range: [0, 100], distribution: 'normal' },
      { name: 'feature_4', type: 'float', range: [0, 100], distribution: 'normal' },
      { name: 'feature_5', type: 'integer', range: [0, 10], distribution: 'normal' },
      { name: 'category', type: 'categorical', values: ['A', 'B', 'C', 'D'], weights: [0.25, 0.35, 0.25, 0.15] },
      { name: 'target', type: 'binary', range: [0, 1], distribution: 'biased' }
    ],
    correlations: {}
  }
};

const DOMAIN_KEYWORDS = {
  medical: ['diabetes', 'health', 'medical', 'patient', 'disease', 'heart', 'hospital', 'clinical', 'diagnosis', 'blood'],
  financial: ['loan', 'credit', 'fraud', 'financial', 'bank', 'payment', 'mortgage', 'insurance', 'transaction', 'stock'],
  education: ['student', 'education', 'school', 'grade', 'gpa', 'exam', 'academic', 'university', 'learning', 'performance'],
  retail: ['retail', 'customer', 'shopping', 'sales', 'purchase', 'product', 'store', 'transaction', 'cart', 'checkout'],
  environmental: ['pollution', 'climate', 'environmental', 'air', 'weather', 'temperature', 'emission', 'carbon', 'sustainability'],
  social: ['social', 'twitter', 'instagram', 'influencer', 'engagement', 'followers', 'likes', 'posts', 'media'],
  hr: ['employee', 'hr', 'hiring', 'recruitment', 'salary', 'performance', 'turnover', 'workforce', 'vacation', 'leave'],
  telecom: ['telecom', 'mobile', 'phone', 'call', 'data', 'subscription', 'plan', 'network', 'churn', 'usage'],
  ecommerce: ['ecommerce', 'order', 'shipping', 'delivery', 'product', 'review', 'rating', 'cart', 'wishlist', 'purchase'],
  agriculture: ['agriculture', 'crop', 'farm', 'harvest', 'yield', 'soil', 'irrigation', 'livestock', 'production'],
  technology: ['software', 'technology', 'code', 'bug', 'repository', 'developer', 'commit', 'deployment', 'server', 'cloud']
};

function analyze(topic) {
  const topicLower = topic.toLowerCase().replace(/\s+/g, '_');
  
  let detectedDomain = 'other';
  let matchedSchema = null;
  let matchScore = 0;
  
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (topicLower.includes(keyword)) {
        if (keywords.indexOf(keyword) < matchScore || matchScore === 0) {
          detectedDomain = domain;
        }
        matchScore++;
      }
    }
  }
  
  const schemaNames = Object.keys(DOMAIN_SCHEMAS).filter(s => s !== 'default');
  for (const schemaName of schemaNames) {
    if (topicLower === schemaName || topicLower.includes(schemaName)) {
      matchedSchema = schemaName;
      matchScore = 1;
      break;
    }
  }
  
  if (!matchedSchema) {
    for (const [schemaName, schema] of Object.entries(DOMAIN_SCHEMAS)) {
      if (schemaName === 'default') continue;
      const similarity = calculateSimilarity(topicLower, schemaName);
      if (similarity > 0.5 && similarity > matchScore) {
        matchedSchema = schemaName;
        matchScore = similarity;
      }
    }
  }
  
  return {
    topic,
    domain: detectedDomain,
    schema: matchedSchema || 'default',
    matchConfidence: Math.min(matchScore / 10, 1)
  };
}

function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase();
  
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/[_\s]+/);
  
  let matches = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1.includes(w2) || w2.includes(w1)) {
        matches++;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

module.exports = { analyze, DOMAIN_SCHEMAS };
