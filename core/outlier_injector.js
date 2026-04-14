/**
 * CODOZ Outlier Injector
 * 
 * Injects realistic outliers based on domain knowledge:
 * - Statistical outliers (>3 std dev)
 * - Domain-specific extreme values
 * - Measurement errors
 * - Rare but possible values
 */

const OUTLIER_DEFINITIONS = {
  // Medical outliers
  heart_disease: {
    resting_blood_pressure: { type: 'extreme', min: 90, max: 200, outliers: [{ value: 210, reason: 'Hypertensive crisis' }, { value: 85, reason: 'Hypotension' }] },
    serum_cholesterol: { type: 'extreme', min: 126, max: 564, outliers: [{ value: 600, reason: 'Familial hypercholesterolemia' }, { value: 100, reason: 'Malnutrition/liver disease' }] },
    maximum_heart_rate: { type: 'range', outliers: [{ value: 220, reason: 'Unrealistic max HR' }] }
  },
  
  diabetes: {
    glucose_concentration: { type: 'extreme', outliers: [{ value: 30, reason: 'Severe hypoglycemia' }, { value: 500, reason: 'Diabetic emergency' }] },
    bmi: { type: 'extreme', outliers: [{ value: 70, reason: 'Extreme obesity' }, { value: 15, reason: 'Severely underweight' }] }
  },
  
  // Financial outliers
  credit_card_fraud: {
    transaction_amount: { type: 'zscore', threshold: 3, reason: 'Unusual transaction size' }
  },
  
  customer_churn: {
    monthly_charges: { type: 'zscore', threshold: 2.5 }
  },
  
  employee_attrition: {
    monthly_income: { type: 'zscore', threshold: 3 },
    years_at_company: { type: 'extreme', outliers: [{ value: 40, reason: 'Long tenure outlier' }] }
  },
  
  // Sensor outliers
  sensor_monitoring: {
    temperature: { type: 'seasonal_extreme', reason: 'Equipment malfunction or extreme weather' },
    pressure: { type: 'seasonal_extreme', reason: 'Barometric pressure anomaly' }
  }
};

/**
 * Inject outliers into dataset
 */
function injectOutliers(dataset, options = {}) {
  const {
    topicKey = 'generic',
    outlierRate = 0.02, // 2% of rows will have outliers
    types = ['statistical', 'domain'] // Types of outliers to inject
  } = options;
  
  const definitions = OUTLIER_DEFINITIONS[topicKey] || {};
  const result = dataset.map(row => {
    const newRow = { ...row };
    
    // Inject domain-specific outliers
    for (const [column, config] of Object.entries(definitions)) {
      if (newRow[column] === undefined) continue;
      if (typeof newRow[column] !== 'number') continue;
      
      if (types.includes('domain') && config.outliers) {
        // Check if we should inject a domain outlier
        if (Math.random() < outlierRate) {
          const outlier = config.outliers[Math.floor(Math.random() * config.outliers.length)];
          newRow[column] = outlier.value;
          newRow[`${column}_outlier`] = outlier.reason;
        }
      }
      
      if (types.includes('statistical') && config.type === 'zscore') {
        // Statistical outliers will be calculated after generation
        // This is handled in post-processing
      }
    }
    
    return newRow;
  });
  
  return result;
}

/**
 * Inject statistical outliers (z-score based)
 */
function injectStatisticalOutliers(dataset, options = {}) {
  const {
    threshold = 3, // Z-score threshold
    percentage = 1 // Percentage of data to mark as outliers
  } = options;
  
  const columns = Object.keys(dataset[0]).filter(col => {
    const values = dataset.map(r => r[col]).filter(v => typeof v === 'number');
    return values.length > 10; // Need enough data points
  });
  
  // Calculate stats for each numeric column
  const columnStats = {};
  columns.forEach(col => {
    const values = dataset.map(r => r[col]).filter(v => typeof v === 'number');
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    columnStats[col] = { mean, std };
  });
  
  // Mark outliers
  return dataset.map(row => {
    const newRow = { ...row };
    
    for (const col of columns) {
      const value = row[col];
      if (typeof value !== 'number') continue;
      
      const { mean, std } = columnStats[col];
      const zScore = Math.abs((value - mean) / std);
      
      if (zScore > threshold) {
        newRow[`${col}_outlier`] = `Statistical outlier (z=${zScore.toFixed(2)})`;
      }
    }
    
    return newRow;
  });
}

/**
 * Inject measurement errors (typos, sensor glitches)
 */
function injectMeasurementErrors(dataset, options = {}) {
  const {
    errorRate = 0.01,
    errorTypes = ['digit_swap', 'magnitude_shift', 'sign_flip']
  } = options;
  
  return dataset.map(row => {
    const newRow = { ...row };
    
    for (const col of Object.keys(row)) {
      const value = row[col];
      if (typeof value !== 'number') continue;
      
      if (Math.random() < errorRate) {
        const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        
        switch (errorType) {
          case 'digit_swap':
            // Swap two adjacent digits
            const str = String(Math.abs(value));
            if (str.length >= 2) {
              const idx = Math.floor(Math.random() * (str.length - 1));
              const arr = str.split('');
              [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
              newRow[col] = parseFloat(arr.join('')) * (value < 0 ? -1 : 1);
            }
            break;
          
          case 'magnitude_shift':
            // Shift decimal point
            const shift = Math.random() > 0.5 ? 10 : 0.1;
            newRow[col] = value * shift;
            break;
          
          case 'sign_flip':
            // Flip sign (rare)
            if (value > 0) {
              newRow[col] = -value;
              newRow[`${col}_error`] = 'Sign error';
            }
            break;
        }
      }
    }
    
    return newRow;
  });
}

/**
 * Get summary of outliers in dataset
 */
function getOutlierSummary(dataset) {
  const summary = {
    totalOutliers: 0,
    columns: {}
  };
  
  Object.keys(dataset[0]).forEach(col => {
    if (col.endsWith('_outlier') || col.endsWith('_error')) {
      const count = dataset.filter(r => r[col]).length;
      if (count > 0) {
        summary.columns[col] = count;
        summary.totalOutliers += count;
      }
    }
  });
  
  return summary;
}

/**
 * Create domain-specific outlier definitions
 */
function createOutlierDefinition(config) {
  return {
    type: 'domain',
    injectRate: config.injectRate || 0.02,
    values: config.values || [],
    reason: config.reason || 'Unusual value'
  };
}

module.exports = {
  OUTLIER_DEFINITIONS,
  injectOutliers,
  injectStatisticalOutliers,
  injectMeasurementErrors,
  getOutlierSummary,
  createOutlierDefinition
};
