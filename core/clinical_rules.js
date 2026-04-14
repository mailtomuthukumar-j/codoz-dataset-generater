/**
 * CODOZ Clinical Rule Engine
 * 
 * Implements REAL medical/business logic for dataset generation.
 * Falls back to statistical generation when no rules exist.
 * 
 * SCALABLE APPROACH:
 * - Topics WITH clinical rules: Use diagnosis rules
 * - Topics WITHOUT clinical rules: Use statistical generation with correlations
 * - Generic topics: Use smart defaults based on entity type
 */

const CLINICAL_RULES = {
  
  heart_disease: {
    name: "Heart Disease Clinical Logic",
    
    // Real UCI Heart Disease Dataset logic
    diagnosisRules: [
      {
        name: "High Risk Composite",
        conditions: [
          { feature: "age", operator: ">=", value: 55 },
          { feature: "serum_cholesterol", operator: ">", value: 240 },
          { feature: "maximum_heart_rate", operator: "<", value: 140 }
        ],
        requireAll: true,
        targetValue: "Yes",
        probability: 0.95
      },
      {
        name: "Typical Angina + ECG Changes",
        conditions: [
          { feature: "chest_pain_type", operator: "==", value: "Typical Angina" },
          { feature: "resting_ecg", operator: "!=", value: "Normal" }
        ],
        requireAll: true,
        targetValue: "Yes",
        probability: 0.85
      },
      {
        name: "Exercise Induced Angina",
        conditions: [
          { feature: "exercise_induced_angina", operator: "==", value: "Yes" },
          { feature: "st_depression", operator: ">", value: 1.0 }
        ],
        requireAll: true,
        targetValue: "Yes",
        probability: 0.90
      },
      {
        name: "ST Depression High",
        conditions: [
          { feature: "st_depression", operator: ">=", value: 2.0 }
        ],
        requireAll: true,
        targetValue: "Yes",
        probability: 0.80
      },
      {
        name: "Reversible Defect",
        conditions: [
          { feature: "thalassemia", operator: "==", value: "Reversible Defect" }
        ],
        requireAll: true,
        targetValue: "Yes",
        probability: 0.85
      },
      {
        name: "Low Risk - Normal Vitals",
        conditions: [
          { feature: "age", operator: "<", value: 45 },
          { feature: "serum_cholesterol", operator: "<", value: 200 },
          { feature: "maximum_heart_rate", operator: ">", value: 160 },
          { feature: "exercise_induced_angina", operator: "==", value: "No" },
          { feature: "chest_pain_type", operator: "==", value: "Asymptomatic" }
        ],
        requireAll: true,
        targetValue: "No",
        probability: 0.90
      },
      {
        name: "Young Normal BP",
        conditions: [
          { feature: "age", operator: "<", value: 40 },
          { feature: "resting_blood_pressure", operator: "<", value: 120 },
          { feature: "chest_pain_type", operator: "in", value: ["Asymptomatic", "Non-Anginal Pain"] }
        ],
        requireAll: true,
        targetValue: "No",
        probability: 0.85
      }
    ],
    
    // Value ranges (STRICT - out of range = reject)
    strictRanges: {
      age: { min: 29, max: 77 },
      resting_blood_pressure: { min: 94, max: 200 },
      serum_cholesterol: { min: 126, max: 564 },
      maximum_heart_rate: { min: 71, max: 202 },
      st_depression: { min: 0, max: 6.2 },
      major_vessels_colored: { min: 0, max: 3 }
    },
    
    // Correlation constraints (features must relate realistically)
    correlations: {
      age_cholesterol: { minCorrelation: 0.1, maxCorrelation: 0.4 },
      age_bp: { minCorrelation: 0.2, maxCorrelation: 0.5 },
      age_heart_rate: { minCorrelation: -0.4, maxCorrelation: -0.1 }
    }
  },
  
  diabetes: {
    name: "Diabetes Clinical Logic",
    
    diagnosisRules: [
      {
        name: "Very High Glucose",
        conditions: [
          { feature: "glucose_concentration", operator: ">=", value: 160 }
        ],
        requireAll: true,
        targetValue: "Positive",
        probability: 0.75
      },
      {
        name: "High Glucose + Obesity",
        conditions: [
          { feature: "glucose_concentration", operator: ">=", value: 130 },
          { feature: "bmi", operator: ">=", value: 32 }
        ],
        requireAll: true,
        targetValue: "Positive",
        probability: 0.70
      },
      {
        name: "High Glucose Alone",
        conditions: [
          { feature: "glucose_concentration", operator: ">=", value: 140 }
        ],
        requireAll: true,
        targetValue: "Positive",
        probability: 0.65
      },
      {
        name: "Obesity Alone",
        conditions: [
          { feature: "bmi", operator: ">=", value: 35 },
          { feature: "age", operator: ">=", value: 40 }
        ],
        requireAll: true,
        targetValue: "Positive",
        probability: 0.55
      },
      {
        name: "Normal All Values",
        conditions: [
          { feature: "glucose_concentration", operator: "<", value: 110 },
          { feature: "bmi", operator: "<", value: 27 }
        ],
        requireAll: true,
        targetValue: "Negative",
        probability: 0.80
      },
      {
        name: "Young Normal BMI",
        conditions: [
          { feature: "age", operator: "<", value: 35 },
          { feature: "bmi", operator: "<", value: 25 },
          { feature: "glucose_concentration", operator: "<", value: 120 }
        ],
        requireAll: true,
        targetValue: "Negative",
        probability: 0.75
      },
      {
        name: "Low Glucose Normal BMI",
        conditions: [
          { feature: "glucose_concentration", operator: "<", value: 100 },
          { feature: "bmi", operator: "<", value: 28 }
        ],
        requireAll: true,
        targetValue: "Negative",
        probability: 0.70
      }
    ],
    
    strictRanges: {
      age: { min: 21, max: 81 },
      glucose_concentration: { min: 44, max: 199 },
      insulin_level: { min: 0, max: 846 },
      bmi: { min: 15.0, max: 67.1 },
      blood_pressure_systolic: { min: 60, max: 180 },
      blood_pressure_diastolic: { min: 40, max: 120 },
      pedigree_diabetes_function: { min: 0.078, max: 2.42 },
      pregnancy_count: { min: 0, max: 17 }
    }
  },
  
  breast_cancer: {
    name: "Breast Cancer Clinical Logic",
    
    diagnosisRules: [
      {
        name: "Large Area + High Concavity",
        conditions: [
          { feature: "area_mean", operator: ">=", value: 800 },
          { feature: "concave_points_mean", operator: ">=", value: 0.12 }
        ],
        requireAll: true,
        targetValue: "Malignant",
        probability: 0.90
      },
      {
        name: "Very Large Radius",
        conditions: [
          { feature: "radius_mean", operator: ">=", value: 20 }
        ],
        requireAll: true,
        targetValue: "Malignant",
        probability: 0.85
      },
      {
        name: "High Compactness + Concavity",
        conditions: [
          { feature: "compactness_mean", operator: ">=", value: 0.15 },
          { feature: "concavity_mean", operator: ">=", value: 0.2 }
        ],
        requireAll: true,
        targetValue: "Malignant",
        probability: 0.82
      },
      {
        name: "Small Benign Features",
        conditions: [
          { feature: "area_mean", operator: "<", value: 500 },
          { feature: "radius_mean", operator: "<", value: 14 },
          { feature: "concave_points_mean", operator: "<", value: 0.06 }
        ],
        requireAll: true,
        targetValue: "Benign",
        probability: 0.92
      }
    ],
    
    strictRanges: {
      radius_mean: { min: 6.98, max: 28.1 },
      texture_mean: { min: 9.71, max: 39.3 },
      perimeter_mean: { min: 43.8, max: 188 },
      area_mean: { min: 143, max: 2501 },
      smoothness_mean: { min: 0.05, max: 0.16 },
      compactness_mean: { min: 0.02, max: 0.35 },
      concavity_mean: { min: 0, max: 0.43 },
      concave_points_mean: { min: 0, max: 0.2 },
      symmetry_mean: { min: 0.1, max: 0.3 },
      fractal_dimension_mean: { min: 0.05, max: 0.1 }
    }
  },
  
  liver_disease: {
    name: "Liver Disease Clinical Logic",
    
    diagnosisRules: [
      {
        name: "High Bilirubin",
        conditions: [
          { feature: "total_bilirubin", operator: ">=", value: 2.0 }
        ],
        requireAll: true,
        targetValue: "Liver Disease",
        probability: 0.88
      },
      {
        name: "High ALT + AST",
        conditions: [
          { feature: "alt_alanine_aminotransferase", operator: ">=", value: 60 },
          { feature: "ast_aspartate_aminotransferase", operator: ">=", value: 50 }
        ],
        requireAll: true,
        targetValue: "Liver Disease",
        probability: 0.85
      },
      {
        name: "Low Albumin",
        conditions: [
          { feature: "albumin", operator: "<", value: 3.5 }
        ],
        requireAll: true,
        targetValue: "Liver Disease",
        probability: 0.80
      },
      {
        name: "Normal Liver Function",
        conditions: [
          { feature: "total_bilirubin", operator: "<", value: 1.2 },
          { feature: "alt_alanine_aminotransferase", operator: "<", value: 40 },
          { feature: "albumin", operator: ">=", value: 3.8 }
        ],
        requireAll: true,
        targetValue: "No Disease",
        probability: 0.90
      }
    ],
    
    strictRanges: {
      age: { min: 4, max: 90 },
      total_bilirubin: { min: 0.4, max: 75.0 },
      direct_bilirubin: { min: 0.1, max: 19.7 },
      alkaline_phosphatase: { min: 63, max: 211 },
      alt_alanine_aminotransferase: { min: 7, max: 200 },
      ast_aspartate_aminotransferase: { min: 10, max: 200 },
      total_proteins: { min: 45, max: 113 },
      albumin: { min: 1.9, max: 9.0 },
      albumin_globulin_ratio: { min: 0.3, max: 3.0 }
    }
  },
  
  kidney_disease: {
    name: "Chronic Kidney Disease Clinical Logic",
    
    diagnosisRules: [
      {
        name: "High Creatinine",
        conditions: [
          { feature: "serum_creatinine", operator: ">=", value: 1.5 }
        ],
        requireAll: true,
        targetValue: "CKD",
        probability: 0.90
      },
      {
        name: "Low Hemoglobin + Abnormal Urine",
        conditions: [
          { feature: "hemoglobin", operator: "<", value: 11 },
          { feature: "blood_urine", operator: "==", value: "Abnormal" }
        ],
        requireAll: true,
        targetValue: "CKD",
        probability: 0.88
      },
      {
        name: "Normal Kidney Function",
        conditions: [
          { feature: "serum_creatinine", operator: "<", value: 1.2 },
          { feature: "hemoglobin", operator: ">=", value: 12 },
          { feature: "blood_urine", operator: "==", value: "Normal" }
        ],
        requireAll: true,
        targetValue: "Not CKD",
        probability: 0.92
      }
    ],
    
    strictRanges: {
      age: { min: 2, max: 90 },
      blood_pressure: { min: 50, max: 180 },
      serum_creatinine: { min: 0.4, max: 76.0 },
      hemoglobin: { min: 3.1, max: 17.8 }
    }
  },
  
  customer_churn: {
    name: "Customer Churn Business Logic",
    
    diagnosisRules: [
      {
        name: "High Risk - Month to Month",
        conditions: [
          { feature: "contract_type", operator: "==", value: "Month-to-Month" },
          { feature: "tenure_months", operator: "<", value: 12 },
          { feature: "tech_support", operator: "==", value: "No" }
        ],
        requireAll: true,
        targetValue: "Churned",
        probability: 0.85
      },
      {
        name: "High Risk - Fiber + No Security",
        conditions: [
          { feature: "internet_service", operator: "==", value: "Fiber Optic" },
          { feature: "online_security", operator: "==", value: "No" },
          { feature: "contract_type", operator: "==", value: "Month-to-Month" }
        ],
        requireAll: true,
        targetValue: "Churned",
        probability: 0.80
      },
      {
        name: "Low Risk - Long Term",
        conditions: [
          { feature: "tenure_months", operator: ">=", value: 36 },
          { feature: "contract_type", operator: "in", value: ["One Year", "Two Year"] }
        ],
        requireAll: true,
        targetValue: "Retained",
        probability: 0.92
      },
      {
        name: "Stable Customer",
        conditions: [
          { feature: "tenure_months", operator: ">=", value: 24 },
          { feature: "tech_support", operator: "==", value: "Yes" },
          { feature: "online_security", operator: "==", value: "Yes" }
        ],
        requireAll: true,
        targetValue: "Retained",
        probability: 0.88
      }
    ],
    
    strictRanges: {
      tenure_months: { min: 0, max: 72 },
      monthly_charges: { min: 18, max: 119 },
      total_charges: { min: 0, max: 9500 }
    }
  }
};

/**
 * Evaluate clinical rules to determine target value
 */
function evaluateClinicalRules(topic, features, strictRanges) {
  const rules = CLINICAL_RULES[topic];
  if (!rules) return null;
  
  for (const rule of rules.diagnosisRules) {
    const allConditionsMet = rule.conditions.every(cond => {
      const featureValue = features[cond.feature];
      if (featureValue === undefined || featureValue === null) return false;
      
      switch (cond.operator) {
        case ">": return featureValue > cond.value;
        case ">=": return featureValue >= cond.value;
        case "<": return featureValue < cond.value;
        case "<=": return featureValue <= cond.value;
        case "==": return String(featureValue) === String(cond.value);
        case "!=": return String(featureValue) !== String(cond.value);
        case "in": return cond.value.includes(String(featureValue));
        default: return false;
      }
    });
    
    if (allConditionsMet) {
      return {
        targetValue: rule.targetValue,
        probability: rule.probability,
        ruleName: rule.name
      };
    }
  }
  
  return null;
}

/**
 * Validate value against strict ranges
 */
function validateStrictRange(featureName, value, strictRanges) {
  const range = strictRanges[featureName];
  if (!range) return { valid: true };
  
  if (typeof value === 'number') {
    if (value < range.min || value > range.max) {
      return { valid: false, reason: `Out of range [${range.min}, ${range.max}]` };
    }
  }
  
  return { valid: true };
}

/**
 * Get strict ranges for a topic
 */
function getStrictRanges(topic) {
  const rules = CLINICAL_RULES[topic];
  return rules?.strictRanges || {};
}

/**
 * Check if topic has clinical rules
 */
function hasClinicalRules(topic) {
  return !!CLINICAL_RULES[topic];
}

module.exports = {
  CLINICAL_RULES,
  evaluateClinicalRules,
  validateStrictRange,
  getStrictRanges,
  hasClinicalRules
};
