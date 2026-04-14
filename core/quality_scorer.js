/**
 * CODOZ Data Quality Scorer
 * 
 * Comprehensive quality scoring for generated datasets:
 * - Distribution accuracy vs expected
 * - Range compliance
 * - Correlation strength
 * - Completeness (missing values)
 * - Uniqueness
 * - Overall quality score
 */

const REAL_WORLD_REFERENCES = {
  diabetes: {
    class_distribution: { Negative: 0.65, Positive: 0.35 },
    feature_stats: {
      glucose_concentration: { mean: 120, std: 32 },
      bmi: { mean: 32, std: 8 },
      age: { mean: 33, std: 12 }
    }
  },
  heart_disease: {
    class_distribution: { No: 0.54, Yes: 0.46 },
    feature_stats: {
      age: { mean: 54, std: 9 },
      resting_blood_pressure: { mean: 131, std: 17 },
      serum_cholesterol: { mean: 199, std: 51 },
      maximum_heart_rate: { mean: 149, std: 23 }
    }
  },
  breast_cancer: {
    class_distribution: { Benign: 0.63, Malignant: 0.37 }
  },
  customer_churn: {
    class_distribution: { Retained: 0.73, Churned: 0.27 }
  },
  employee_attrition: {
    class_distribution: { Stayed: 0.84, Left: 0.16 }
  },
  loan_default: {
    class_distribution: { 'No Default': 0.80, Default: 0.20 }
  }
};

/**
 * Calculate comprehensive quality score
 */
function calculateQualityScore(dataset, topicKey, options = {}) {
  const scores = {
    distributionAccuracy: 0,
    rangeCompliance: 0,
    meanAccuracy: 0,
    uniqueness: 0,
    completeness: 0,
    correlationStrength: 0
  };
  
  const weights = {
    distributionAccuracy: 0.25,
    rangeCompliance: 0.15,
    meanAccuracy: 0.20,
    uniqueness: 0.10,
    completeness: 0.15,
    correlationStrength: 0.15
  };
  
  // 1. Distribution Accuracy
  scores.distributionAccuracy = calculateDistributionAccuracy(dataset, topicKey);
  
  // 2. Range Compliance
  scores.rangeCompliance = calculateRangeCompliance(dataset);
  
  // 3. Mean Accuracy
  scores.meanAccuracy = calculateMeanAccuracy(dataset, topicKey);
  
  // 4. Uniqueness
  scores.uniqueness = calculateUniqueness(dataset);
  
  // 5. Completeness
  scores.completeness = calculateCompleteness(dataset);
  
  // 6. Correlation Strength
  scores.correlationStrength = calculateCorrelationStrength(dataset, topicKey);
  
  // Calculate weighted overall score
  let overallScore = 0;
  for (const [metric, weight] of Object.entries(weights)) {
    overallScore += scores[metric] * weight;
  }
  
  return {
    overall: Math.round(overallScore),
    breakdown: {
      distributionAccuracy: Math.round(scores.distributionAccuracy),
      rangeCompliance: Math.round(scores.rangeCompliance),
      meanAccuracy: Math.round(scores.meanAccuracy),
      uniqueness: Math.round(scores.uniqueness),
      completeness: Math.round(scores.completeness),
      correlationStrength: Math.round(scores.correlationStrength)
    },
    grade: getGrade(overallScore),
    recommendations: getRecommendations(scores)
  };
}

function calculateDistributionAccuracy(dataset, topicKey) {
  const reference = REAL_WORLD_REFERENCES[topicKey];
  if (!reference || !reference.class_distribution) return 100;
  
  const targetCol = findTargetColumn(dataset);
  if (!targetCol) return 100;
  
  const actualDist = {};
  dataset.forEach(row => {
    const val = String(row[targetCol]);
    actualDist[val] = (actualDist[val] || 0) + 1;
  });
  
  const total = dataset.length;
  let totalError = 0;
  
  for (const [className, expectedRatio] of Object.entries(reference.class_distribution)) {
    const expected = expectedRatio * total;
    const actual = actualDist[className] || 0;
    const error = Math.abs(actual - expected) / expected;
    totalError += error;
  }
  
  const avgError = totalError / Object.keys(reference.class_distribution).length;
  return Math.max(0, 100 - avgError * 50);
}

function calculateRangeCompliance(dataset) {
  const columns = Object.keys(dataset[0]);
  let totalViolations = 0;
  let totalChecks = 0;
  
  // Define expected ranges for common features
  const ranges = {
    age: [18, 100],
    glucose_concentration: [44, 200],
    bmi: [10, 70],
    resting_blood_pressure: [80, 220],
    serum_cholesterol: [100, 600],
    maximum_heart_rate: [60, 220]
  };
  
  for (const col of columns) {
    const range = ranges[col.toLowerCase()];
    if (!range) continue;
    
    const values = dataset.map(r => r[col]).filter(v => typeof v === 'number');
    if (values.length === 0) continue;
    
    totalChecks++;
    
    const violations = values.filter(v => v < range[0] || v > range[1]).length;
    totalViolations += violations / values.length;
  }
  
  if (totalChecks === 0) return 100;
  return Math.max(0, 100 - (totalViolations / totalChecks) * 100);
}

function calculateMeanAccuracy(dataset, topicKey) {
  const reference = REAL_WORLD_REFERENCES[topicKey];
  if (!reference || !reference.feature_stats) return 100;
  
  let totalError = 0;
  let featuresChecked = 0;
  
  for (const [feature, stats] of Object.entries(reference.feature_stats)) {
    const values = dataset.map(r => r[feature]).filter(v => typeof v === 'number');
    if (values.length === 0) continue;
    
    const actualMean = values.reduce((a, b) => a + b, 0) / values.length;
    const expectedMean = stats.mean;
    
    const error = Math.abs(actualMean - expectedMean) / expectedMean;
    totalError += error;
    featuresChecked++;
  }
  
  if (featuresChecked === 0) return 100;
  const avgError = totalError / featuresChecked;
  return Math.max(0, 100 - avgError * 100);
}

function calculateUniqueness(dataset) {
  if (dataset.length === 0) return 100;
  
  const uniqueRows = new Set(dataset.map(r => JSON.stringify(r))).size;
  return (uniqueRows / dataset.length) * 100;
}

function calculateCompleteness(dataset) {
  if (dataset.length === 0) return 100;
  
  let totalCells = 0;
  let missingCells = 0;
  
  dataset.forEach(row => {
    Object.values(row).forEach(val => {
      totalCells++;
      if (val === null || val === undefined || val === '') {
        missingCells++;
      }
    });
  });
  
  return ((totalCells - missingCells) / totalCells) * 100;
}

function calculateCorrelationStrength(dataset, topicKey) {
  const correlations = {
    diabetes: [['age', 'glucose_concentration'], ['bmi', 'glucose_concentration']],
    heart_disease: [['age', 'serum_cholesterol'], ['age', 'resting_blood_pressure']],
    customer_churn: [['tenure_months', 'total_charges']]
  };
  
  const featurePairs = correlations[topicKey];
  if (!featurePairs) return 80; // Default score if no defined correlations
  
  let totalCorrelation = 0;
  let pairsChecked = 0;
  
  for (const [f1, f2] of featurePairs) {
    const vals1 = dataset.map(r => r[f1]).filter(v => typeof v === 'number');
    const vals2 = dataset.map(r => r[f2]).filter(v => typeof v === 'number');
    
    if (vals1.length < 10 || vals2.length < 10) continue;
    
    const corr = pearsonCorrelation(vals1, vals2);
    // Expected positive correlation for these pairs
    const expectedSign = corr > 0 ? 1 : -1;
    totalCorrelation += Math.abs(corr);
    pairsChecked++;
  }
  
  if (pairsChecked === 0) return 80;
  return (totalCorrelation / pairsChecked) * 100;
}

function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n === 0) return 0;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function findTargetColumn(dataset) {
  const firstRow = dataset[0];
  const patterns = ['diagnosis', 'target', 'status', 'disease', 'churn', 'attrition', 'default'];
  
  for (const col of Object.keys(firstRow)) {
    const lower = col.toLowerCase();
    if (patterns.some(p => lower.includes(p))) {
      return col;
    }
  }
  
  // Return last column with limited unique values
  for (const col of Object.keys(firstRow).reverse()) {
    const unique = new Set(dataset.map(r => r[col]));
    if (unique.size >= 2 && unique.size <= 10) {
      return col;
    }
  }
  
  return null;
}

function getGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 65) return 'D';
  return 'F';
}

function getRecommendations(scores) {
  const recommendations = [];
  
  if (scores.distributionAccuracy < 85) {
    recommendations.push('Target distribution deviates from expected - consider adjusting class ratios');
  }
  if (scores.rangeCompliance < 90) {
    recommendations.push('Some values exceed expected ranges - review value constraints');
  }
  if (scores.meanAccuracy < 85) {
    recommendations.push('Feature means differ from real-world data - adjust generation parameters');
  }
  if (scores.completeness < 95) {
    recommendations.push('Missing values detected - consider adding missing value patterns');
  }
  if (scores.correlationStrength < 60) {
    recommendations.push('Feature correlations are weak - enhance correlation rules');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Dataset quality is excellent!');
  }
  
  return recommendations;
}

module.exports = {
  calculateQualityScore,
  pearsonCorrelation,
  REAL_WORLD_REFERENCES
};
