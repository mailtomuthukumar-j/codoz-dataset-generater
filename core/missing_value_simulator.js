/**
 * CODOZ Missing Value Simulator
 * 
 * Simulates realistic missing value patterns found in real-world datasets:
 * - Random missing (MCAR - Missing Completely at Random)
 * - Missing at end of record (censored data)
 * - Missing based on another variable (MAR - Missing at Random)
 * - Systematic missing (pattern-based)
 */

const MISSING_PATTERNS = {
  // Medical datasets often have missing lab values
  medical: {
    insulin_level: { pattern: 'mcar', probability: 0.05 },
    blood_pressure_diastolic: { pattern: 'mar', depends_on: 'blood_pressure_systolic', threshold: 0.7 }
  },
  
  // Survey data has common missing patterns
  survey: {
    income: { pattern: 'mcar', probability: 0.08 },
    employment_length: { pattern: 'mar', depends_on: 'age', condition: (age) => age > 65, missing_if: true }
  },
  
  // Sensor data has downtime gaps
  sensor: {
    temperature: { pattern: 'gap', max_gap_hours: 4, probability: 0.03 },
    humidity: { pattern: 'gap', max_gap_hours: 4, probability: 0.03 }
  }
};

/**
 * Inject missing values into a dataset
 */
function injectMissingValues(dataset, options = {}) {
  const {
    topicKey = 'generic',
    missingRate = 0.02, // Overall missing rate
    pattern = 'mcar', // Default pattern
    preserveTarget = true // Don't add missing to target column
  } = options;
  
  const patterns = MISSING_PATTERNS[topicKey] || getDefaultPatterns();
  
  const result = dataset.map(row => {
    const newRow = { ...row };
    
    for (const [column, config] of Object.entries(patterns)) {
      if (newRow[column] === undefined) continue;
      if (preserveTarget && isTargetColumn(column)) continue;
      
      if (shouldBeMissing(row, column, config)) {
        newRow[column] = null;
      }
    }
    
    return newRow;
  });
  
  return result;
}

/**
 * Check if a value should be missing based on pattern
 */
function shouldBeMissing(row, column, config) {
  switch (config.pattern) {
    case 'mcar':
      // Missing Completely at Random
      return Math.random() < config.probability;
    
    case 'mar':
      // Missing at Random - depends on another variable
      if (config.depends_on && row[config.depends_on] !== undefined) {
        const depValue = row[config.depends_on];
        if (config.condition) {
          return config.condition(depValue);
        }
        if (config.threshold !== undefined) {
          return depValue > config.threshold && Math.random() < config.probability;
        }
      }
      return Math.random() < config.probability;
    
    case 'systematic':
      // Always missing for certain conditions
      if (config.condition) {
        return config.condition(row);
      }
      return false;
    
    case 'not_applicable':
      // Field doesn't apply (e.g., pregnancy count for males)
      if (config.applies_to) {
        return !config.applies_to(row);
      }
      return false;
    
    default:
      return Math.random() < (config.probability || 0.02);
  }
}

/**
 * Get default missing patterns for generic datasets
 */
function getDefaultPatterns() {
  return {
    value_1: { pattern: 'mcar', probability: 0.01 },
    value_2: { pattern: 'mcar', probability: 0.01 }
  };
}

/**
 * Check if column is a target column
 */
function isTargetColumn(column) {
  const targetPatterns = [
    'diagnosis', 'target', 'status', 'result', 'outcome',
    'disease', 'churn', 'attrition', 'default', 'failure', 'fraud'
  ];
  const lower = column.toLowerCase();
  return targetPatterns.some(p => lower.includes(p));
}

/**
 * Create a missing value indicator column
 */
function createMissingIndicators(dataset) {
  const columns = Object.keys(dataset[0]);
  const indicatorColumns = {};
  
  columns.forEach(col => {
    const indicatorName = `${col}_missing`;
    indicatorColumns[indicatorName] = dataset.map(row => row[col] === null || row[col] === undefined);
  });
  
  return indicatorColumns;
}

/**
 * Summary of missing values in dataset
 */
function getMissingValueSummary(dataset) {
  const summary = {};
  const columns = Object.keys(dataset[0]);
  
  columns.forEach(col => {
    const missing = dataset.filter(row => row[col] === null || row[col] === undefined).length;
    if (missing > 0) {
      summary[col] = {
        count: missing,
        percentage: (missing / dataset.length * 100).toFixed(2)
      };
    }
  });
  
  return summary;
}

/**
 * Generate missing value pattern based on domain
 */
function getMissingPatternForDomain(domain) {
  const patterns = {
    medical: {
      blood_pressure: { pattern: 'mcar', probability: 0.02 },
      cholesterol: { pattern: 'mcar', probability: 0.03 },
      glucose: { pattern: 'mcar', probability: 0.01 }
    },
    financial: {
      income: { pattern: 'mcar', probability: 0.05 },
      credit_score: { pattern: 'mcar', probability: 0.01 },
      account_balance: { pattern: 'gap', probability: 0.02 }
    },
    survey: {
      satisfaction_score: { pattern: 'mcar', probability: 0.08 },
      feedback: { pattern: 'mcar', probability: 0.15 },
      optional_field: { pattern: 'mcar', probability: 0.25 }
    },
    sensor: {
      temperature: { pattern: 'gap', probability: 0.05 },
      humidity: { pattern: 'gap', probability: 0.05 },
      pressure: { pattern: 'gap', probability: 0.02 }
    }
  };
  
  return patterns[domain] || getDefaultPatterns();
}

module.exports = {
  MISSING_PATTERNS,
  injectMissingValues,
  createMissingIndicators,
  getMissingValueSummary,
  getMissingPatternForDomain
};
