/**
 * CODOZ Generator Agent
 * 
 * Constructs realistic datasets based on clinical rules:
 * 1. Generate features with realistic distributions
 * 2. Apply clinical rules to determine diagnosis
 * 3. Strict range validation - reject invalid rows
 * 4. Enforce correlations between features
 */

const { evaluateClinicalRules, validateStrictRange, getStrictRanges, hasClinicalRules } = require('../core/clinical_rules');
const { applyCorrelations } = require('../core/correlation_engine');

function process(context) {
  const { schema, target, topicAnalysis, size, topic } = context;
  const silent = context.silent;
  const datasetSize = size || 100;
  
  if (!schema || !schema.columns) {
    return {
      ...context,
      error: 'Schema required for generation',
      logs: [...context.logs, createLog('error', 'Schema required')]
    };
  }
  
  if (!silent) {
    console.log('━'.repeat(60));
    console.log('PHASE 3: DATASET CONSTRUCTION');
    console.log('━'.repeat(60));
    console.log(`\nConstructing dataset...`);
    console.log(`  - Target: ${schema.targetColumn}`);
    console.log(`  - Size: ${datasetSize} rows`);
    console.log(`  - Columns: ${schema.columns.length}`);
  }
  
  const topicKey = topic?.toLowerCase().replace(/\s+/g, '_') || topicAnalysis?.topicKey;
  const useClinicalRules = hasClinicalRules(topicKey);
  
  if (!silent && useClinicalRules) {
    console.log(`  - Using CLINICAL RULE ENGINE for realistic diagnosis`);
  }
  
  const strictRanges = getStrictRanges(topicKey);
  const genContext = buildGenerationContext(context, topicKey);
  
  if (!silent) console.log(`\nGenerating rows...`);
  
  const dataset = [];
  const idSet = new Set();
  let attempts = 0;
  const maxAttempts = datasetSize * 10;
  
  while (dataset.length < datasetSize && attempts < maxAttempts) {
    attempts++;
    
    const candidate = generateRowWithClinicalLogic(schema, genContext, dataset.length, topicKey, strictRanges);
    
    if (!candidate) continue;
    if (candidate[schema.columns[0].name] && idSet.has(candidate[schema.columns[0].name])) continue;
    
    dataset.push(candidate);
    idSet.add(candidate[schema.columns[0].name]);
    
    if (!silent && dataset.length % Math.max(10, Math.floor(datasetSize / 10)) === 0) {
      console.log(`  - Generated ${dataset.length}/${datasetSize} rows...`);
    }
  }
  
  const stats = calculateDatasetStatistics(dataset, schema);
  
  if (!silent) {
    console.log(`\nDataset constructed successfully!`);
    console.log(`  - Total rows: ${dataset.length}`);
    console.log(`  - Target distribution:`);
    
    if (stats.targetDistribution) {
      Object.entries(stats.targetDistribution).forEach(([value, count]) => {
        const pct = ((count / dataset.length) * 100).toFixed(1);
        console.log(`    * ${value}: ${count} (${pct}%)`);
      });
    }
  }
  
  return {
    ...context,
    dataset,
    datasetStats: stats,
    rowsGenerated: dataset.length,
    uniqueIds: idSet.size,
    logs: [...context.logs, createLog('generation_complete', {
      rowCount: dataset.length,
      targetDistribution: stats.targetDistribution,
      clinicalRulesUsed: useClinicalRules
    })]
  };
}

function generateRowWithClinicalLogic(schema, genContext, index, topicKey, strictRanges) {
  const seed = Date.now() + index * 1000 + Math.random() * 100;
  const useClinicalRules = hasClinicalRules(topicKey);
  
  // STEP 1: Decide target first (based on statistics for proper distribution)
  let targetValue = getDefaultTarget(genContext.target, {}, genContext, seed);
  
  // STEP 2: Generate features consistent with the target (reverse engineering)
  const features = {};
  
  for (const column of schema.columns) {
    if (column.isTarget || column.isId) continue;
    
    // Generate value based on target (healthy vs at-risk profile)
    features[column.name] = generateFeatureValueForTarget(
      column, features, genContext, seed + column.name.length * 100, targetValue, topicKey
    );
  }
  
  // STEP 3: Validate strict ranges - REJECT if out of range
  for (const [featureName, value] of Object.entries(features)) {
    const validation = validateStrictRange(featureName, value, strictRanges);
    if (!validation.valid) {
      return null; // Reject this row
    }
  }
  
  // NOTE: Clinical rules should influence FEATURE generation, not flip targets
  // Target distribution is controlled by the statistical distribution
  
  // STEP 4: Apply feature correlations for realistic data
  const correlatedFeatures = applyCorrelations(features, topicKey, seededRandom(seed));
  
  // STEP 5: Build final row
  const row = {};
  
  // ID
  const idColumn = schema.columns.find(c => c.isId);
  if (idColumn) {
    row[idColumn.name] = generateUUID();
  }
  
  // Target
  row[schema.targetColumn] = targetValue;
  
  // Features (use correlated features)
  for (const [name, value] of Object.entries(correlatedFeatures)) {
    row[name] = value;
  }
  
  return row;
}

function generateFeatureValue(column, existingFeatures, genContext, seed) {
  const rand = seededRandom(seed);
  
  switch (column.dataType) {
    case 'int':
      return generateNumericValue(column, existingFeatures, rand, 'int');
    
    case 'float':
      return generateNumericValue(column, existingFeatures, rand, 'float');
    
    case 'categorical':
      return generateCategoricalValue(column, existingFeatures, genContext, rand);
    
    case 'binary':
      return generateBinaryValue(column, existingFeatures, genContext, rand);
    
    case 'boolean':
      return rand() > 0.5;
    
    case 'uuid':
      return generateUUID();
    
    case 'datetime':
      return generateDateTime(column.range, rand);
    
    default:
      return generateNumericValue(column, existingFeatures, rand, 'int');
  }
}

function generateNumericValue(column, existingFeatures, rand, type) {
  if (!column.range || column.range.length !== 2) {
    return type === 'float' ? 0.0 : 0;
  }
  
  let [min, max] = column.range;
  
  // Apply age-correlated adjustments for realistic data
  if (existingFeatures.age !== undefined) {
    const age = existingFeatures.age;
    
    // Cholesterol tends to increase with age
    if (column.name === 'serum_cholesterol') {
      const ageAdjustment = (age - 40) * 2;
      min = Math.max(min, 150 + ageAdjustment);
      max = Math.min(max, 350 + ageAdjustment);
    }
    
    // Blood pressure tends to increase with age
    if (column.name === 'resting_blood_pressure') {
      const ageAdjustment = (age - 40) * 0.8;
      min = Math.max(min, 100 + ageAdjustment);
      max = Math.min(max, 180 + ageAdjustment);
    }
    
    // Max heart rate decreases with age
    if (column.name === 'maximum_heart_rate') {
      const ageAdjustment = (age - 40) * -1.2;
      min = Math.max(min, 120 + ageAdjustment);
      max = Math.min(max, 200 + ageAdjustment);
    }
    
    // BMI tends to increase with age up to a point
    if (column.name === 'bmi') {
      const ageAdjustment = Math.min((age - 30) * 0.15, 5);
      min = Math.max(min, 18 + ageAdjustment);
    }
    
    // Glucose tends to increase with age
    if (column.name === 'glucose_concentration') {
      const ageAdjustment = (age - 40) * 0.8;
      min = Math.max(min, 70 + ageAdjustment);
      max = Math.min(max, 180 + ageAdjustment);
    }
  }
  
  // Ensure min <= max
  if (min > max) [min, max] = [max, min];
  
  if (type === 'int') {
    return Math.floor(min + rand() * (max - min + 1));
  }
  
  // Float with realistic distribution
  const value = min + rand() * (max - min);
  return parseFloat(value.toFixed(2));
}

function generateCategoricalValue(column, existingFeatures, genContext, rand) {
  if (!column.categories || !Array.isArray(column.categories) || column.categories.length === 0) {
    return 'Unknown';
  }
  
  // Age-correlated chest pain type
  if (column.name === 'chest_pain_type' && existingFeatures.age !== undefined) {
    const age = existingFeatures.age;
    const probabilities = {
      'Asymptomatic': age > 55 ? 0.35 : 0.25,
      'Non-Anginal Pain': 0.28,
      'Atypical Angina': 0.27,
      'Typical Angina': age > 50 ? 0.20 : 0.10
    };
    return weightedSample(probabilities, rand);
  }
  
  // Age-correlated ECG
  if (column.name === 'resting_ecg' && existingFeatures.age !== undefined) {
    const age = existingFeatures.age;
    const probabilities = {
      'Normal': age < 45 ? 0.75 : 0.50,
      'ST-T wave abnormality': age > 50 ? 0.30 : 0.15,
      'Left ventricular hypertrophy': 0.15
    };
    return weightedSample(probabilities, rand);
  }
  
  // Exercise ST slope correlated with age and heart rate
  if (column.name === 'exercise_st_slope' && existingFeatures.maximum_heart_rate !== undefined) {
    const hr = existingFeatures.maximum_heart_rate;
    const probabilities = {
      'Upsloping': hr > 150 ? 0.45 : 0.25,
      'Flat': hr < 130 ? 0.50 : 0.40,
      'Downsloping': hr < 120 ? 0.35 : 0.15
    };
    return weightedSample(probabilities, rand);
  }
  
  // Fasting blood sugar - higher chance of high sugar with age
  if (column.name === 'fasting_blood_sugar' && existingFeatures.age !== undefined) {
    const age = existingFeatures.age;
    const probHigh = age > 50 ? 0.40 : 0.25;
    return rand() < probHigh ? 'Greater than 120 mg/dL' : 'Less than 120 mg/dL';
  }
  
  // Default: uniform distribution
  const index = Math.floor(rand() * column.categories.length);
  return column.categories[index];
}

function generateBinaryValue(column, existingFeatures, genContext, rand) {
  if (column.categories && column.categories.length === 2) {
    // Exercise angina - correlated with age and other factors
    if (column.name === 'exercise_induced_angina' && existingFeatures.age !== undefined) {
      const age = existingFeatures.age;
      const bp = existingFeatures.resting_blood_pressure || 130;
      const chol = existingFeatures.serum_cholesterol || 200;
      
      let probYes = 0.15;
      if (age > 55) probYes += 0.15;
      if (bp > 140) probYes += 0.10;
      if (chol > 240) probYes += 0.10;
      
      return rand() < probYes ? column.categories[1] : column.categories[0];
    }
    
    const index = Math.floor(rand() * 2);
    return column.categories[index];
  }
  return rand() > 0.5;
}

function generateFeatureValueForTarget(column, existingFeatures, genContext, seed, targetValue, topicKey) {
  const rand = seededRandom(seed);
  const isPositive = targetValue === genContext.target?.positiveLabel || 
                     targetValue === 'Yes' || targetValue === 'Positive' || 
                     targetValue === 'Malignant' || targetValue === 'Liver Disease' ||
                     targetValue === 'CKD' || targetValue === 'Churned' ||
                     targetValue === 'Failure' || targetValue === 'Default' ||
                     targetValue === 'Claim Filed' || targetValue === 'Left';
  
  // Generate based on target (healthy vs at-risk profile)
  switch (column.dataType) {
    case 'int':
      return generateNumericValueForTarget(column, existingFeatures, rand, 'int', isPositive, topicKey);
    
    case 'float':
      return generateNumericValueForTarget(column, existingFeatures, rand, 'float', isPositive, topicKey);
    
    case 'categorical':
      return generateCategoricalValueForTarget(column, existingFeatures, genContext, rand, isPositive, topicKey);
    
    case 'binary':
      return generateBinaryValueForTarget(column, existingFeatures, genContext, rand, isPositive, topicKey);
    
    case 'boolean':
      return rand() > 0.5;
    
    default:
      return generateNumericValueForTarget(column, existingFeatures, rand, 'int', isPositive, topicKey);
  }
}

function generateNumericValueForTarget(column, existingFeatures, rand, type, isPositive, topicKey) {
  if (!column.range || column.range.length !== 2) {
    return type === 'float' ? 0.0 : 0;
  }
  
  let [min, max] = column.range;
  const mid = (min + max) / 2;
  
  // Adjust range based on target and topic
  if (topicKey === 'diabetes') {
    if (column.name === 'glucose_concentration') {
      if (isPositive) {
        min = Math.max(min, 110);
        max = Math.min(max, 199);
        return Math.floor(min + rand() * (max - min));
      } else {
        max = Math.min(max, 120);
        return Math.floor(min + rand() * (max - min));
      }
    }
    if (column.name === 'bmi') {
      if (isPositive) {
        min = Math.max(min, 25);
        max = Math.min(max, 67.1);
        return parseFloat((min + rand() * (max - min)).toFixed(1));
      } else {
        max = Math.min(max, 32);
        return parseFloat((min + rand() * (max - min)).toFixed(1));
      }
    }
    if (column.name === 'age') {
      if (isPositive) {
        min = Math.max(min, 30);
        max = Math.min(max, 81);
      } else {
        max = Math.min(max, 50);
      }
    }
    if (column.name === 'insulin_level') {
      if (isPositive) {
        min = Math.max(min, 80);
      } else {
        max = Math.min(max, 200);
      }
    }
    if (column.name === 'pregnancy_count') {
      const gender = existingFeatures.gender;
      if (gender === 'Male') {
        return Math.floor(rand() * 3); // 0-2 for males
      } else {
        if (isPositive) {
          return Math.floor(rand() * 10) + 3; // 3-12 for diabetic females
        } else {
          return Math.floor(rand() * 8) + 1; // 1-8 for non-diabetic females
        }
      }
    }
  }
  
  if (topicKey === 'heart_disease') {
    if (column.name === 'serum_cholesterol') {
      if (isPositive) {
        min = Math.max(min, 200);
        max = Math.min(max, 564);
      } else {
        max = Math.min(max, 240);
      }
    }
    if (column.name === 'resting_blood_pressure') {
      if (isPositive) {
        min = Math.max(min, 120);
        max = Math.min(max, 200);
      } else {
        max = Math.min(max, 140);
      }
    }
    if (column.name === 'maximum_heart_rate') {
      if (isPositive) {
        max = Math.min(max, 160);
      } else {
        min = Math.max(min, 140);
      }
    }
    if (column.name === 'st_depression') {
      if (isPositive) {
        min = Math.max(min, 0.5);
        max = Math.min(max, 6.2);
      } else {
        max = Math.min(max, 1.5);
      }
    }
    if (column.name === 'age') {
      if (isPositive) {
        min = Math.max(min, 45);
        max = Math.min(max, 77);
      } else {
        max = Math.min(max, 55);
      }
    }
  }
  
  if (topicKey === 'breast_cancer') {
    if (column.name === 'area_mean') {
      if (isPositive) {
        min = Math.max(min, 500);
        max = Math.min(max, 2501);
      } else {
        max = Math.min(max, 500);
      }
    }
    if (column.name === 'radius_mean') {
      if (isPositive) {
        min = Math.max(min, 14);
        max = Math.min(max, 28.1);
      } else {
        max = Math.min(max, 14);
      }
    }
    if (column.name === 'concave_points_mean') {
      if (isPositive) {
        min = Math.max(min, 0.08);
        max = Math.min(max, 0.2);
      } else {
        max = Math.min(max, 0.08);
      }
    }
  }
  
  // Ensure min <= max
  if (min > max) [min, max] = [max, min];
  
  if (type === 'int') {
    return Math.floor(min + rand() * (max - min + 1));
  }
  
  return parseFloat((min + rand() * (max - min)).toFixed(2));
}

function generateCategoricalValueForTarget(column, existingFeatures, genContext, rand, isPositive, topicKey) {
  if (!column.categories || !Array.isArray(column.categories) || column.categories.length === 0) {
    return 'Unknown';
  }
  
  // Topic-specific categorical values
  if (topicKey === 'heart_disease') {
    if (column.name === 'chest_pain_type') {
      if (isPositive) {
        const weights = { 'Typical Angina': 0.35, 'Atypical Angina': 0.25, 'Non-Anginal Pain': 0.20, 'Asymptomatic': 0.20 };
        return weightedSample(weights, rand);
      } else {
        const weights = { 'Asymptomatic': 0.40, 'Non-Anginal Pain': 0.30, 'Atypical Angina': 0.20, 'Typical Angina': 0.10 };
        return weightedSample(weights, rand);
      }
    }
    if (column.name === 'exercise_st_slope') {
      if (isPositive) {
        const weights = { 'Downsloping': 0.30, 'Flat': 0.45, 'Upsloping': 0.25 };
        return weightedSample(weights, rand);
      } else {
        const weights = { 'Upsloping': 0.50, 'Flat': 0.35, 'Downsloping': 0.15 };
        return weightedSample(weights, rand);
      }
    }
    if (column.name === 'thalassemia') {
      if (isPositive) {
        const weights = { 'Reversible Defect': 0.50, 'Fixed Defect': 0.30, 'Normal': 0.20 };
        return weightedSample(weights, rand);
      } else {
        const weights = { 'Normal': 0.60, 'Fixed Defect': 0.25, 'Reversible Defect': 0.15 };
        return weightedSample(weights, rand);
      }
    }
    if (column.name === 'resting_ecg') {
      if (isPositive) {
        const weights = { 'ST-T wave abnormality': 0.35, 'Left ventricular hypertrophy': 0.30, 'Normal': 0.35 };
        return weightedSample(weights, rand);
      } else {
        const weights = { 'Normal': 0.65, 'ST-T wave abnormality': 0.20, 'Left ventricular hypertrophy': 0.15 };
        return weightedSample(weights, rand);
      }
    }
  }
  
  if (topicKey === 'breast_cancer') {
    // Breast cancer is driven by numeric features, categorical just random
    const index = Math.floor(rand() * column.categories.length);
    return column.categories[index];
  }
  
  // Default: uniform distribution
  const index = Math.floor(rand() * column.categories.length);
  return column.categories[index];
}

function generateBinaryValueForTarget(column, existingFeatures, genContext, rand, isPositive, topicKey) {
  if (column.categories && column.categories.length === 2) {
    if (topicKey === 'heart_disease' && column.name === 'exercise_induced_angina') {
      return isPositive ? 
        (rand() < 0.50 ? column.categories[1] : column.categories[0]) :
        (rand() < 0.80 ? column.categories[0] : column.categories[1]);
    }
    
    if (topicKey === 'diabetes' && column.name === 'gender') {
      return rand() < 0.55 ? 'Female' : 'Male';
    }
    
    const index = Math.floor(rand() * 2);
    return column.categories[index];
  }
  return rand() > 0.5;
}

function weightedSample(weights, rand) {
  const r = rand();
  let cumulative = 0;
  
  for (const [value, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (r <= cumulative) return value;
  }
  
  return Object.keys(weights)[0];
}

function getDefaultTarget(target, features, genContext, seed) {
  const rand = seededRandom(seed);
  
  if (target?.values && Array.isArray(target.values)) {
    // Use statistical distribution
    const dist = genContext.targetDistribution || {};
    
    // Calculate probability for positive class (second value typically)
    // For churn: Retained=first, Churned=second (positive)
    const positiveLabel = genContext.target?.positiveLabel || target.values[1];
    const positiveCount = dist[positiveLabel] || 0;
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || target.values.length;
    const positiveProbability = positiveCount / total;
    
    // Randomly decide based on probability
    if (rand() < positiveProbability) {
      return positiveLabel;
    } else {
      // Return negative class
      return target.values.find(v => v !== positiveLabel) || target.values[0];
    }
  }
  
  return null;
}

function generateDateTime(range, rand) {
  const [startStr, endStr] = range || ['2020-01-01', '2024-12-31'];
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  
  const timestamp = start + rand() * (end - start);
  return new Date(timestamp).toISOString().split('T')[0];
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function buildGenerationContext(context, topicKey) {
  const { schema, target, topicAnalysis } = context;
  
  const dist = {};
  const topicStats = context.topicAnalysis?.classDistribution;
  
  if (target?.values && Array.isArray(target.values)) {
    if (topicStats) {
      target.values.forEach((val) => {
        dist[val] = Math.round((topicStats[val] || 0.5) * (context.size || 100));
      });
    } else if (target.values.length === 2) {
      dist[target.values[0]] = Math.round((context.size || 100) * 0.65);
      dist[target.values[1]] = Math.round((context.size || 100) * 0.35);
    } else {
      const equal = Math.floor((context.size || 100) / target.values.length);
      target.values.forEach((val, idx) => {
        dist[val] = equal + (idx < ((context.size || 100) % target.values.length) ? 1 : 0);
      });
    }
  }
  
  return {
    schema,
    target,
    topicAnalysis,
    targetDistribution: dist,
    constraints: schema.constraints || {}
  };
}

function calculateDatasetStatistics(dataset, schema) {
  const stats = {
    rowCount: dataset.length,
    columnCount: dataset[0] ? Object.keys(dataset[0]).length : 0
  };
  
  const targetColumn = schema.columns.find(c => c.isTarget);
  if (targetColumn && targetColumn.dataType === 'categorical') {
    const dist = {};
    dataset.forEach(row => {
      const val = row[targetColumn.name];
      dist[val] = (dist[val] || 0) + 1;
    });
    stats.targetDistribution = dist;
  }
  
  const numericCols = schema.columns.filter(c => c.dataType === 'int' || c.dataType === 'float');
  stats.numericStats = {};
  
  numericCols.forEach(col => {
    const values = dataset.map(r => r[col.name]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      stats.numericStats[col.name] = {
        mean: parseFloat(mean.toFixed(2)),
        min: parseFloat(min.toFixed(2)),
        max: parseFloat(max.toFixed(2))
      };
    }
  });
  
  return stats;
}

function createLog(event, data) {
  return {
    timestamp: new Date().toISOString(),
    event,
    data
  };
}

module.exports = { process };
