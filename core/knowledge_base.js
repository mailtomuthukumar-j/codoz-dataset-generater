/**
 * CODOZ Knowledge Base
 * 
 * Comprehensive topic-to-schema mapping for realistic dataset generation.
 * Each topic contains:
 * - Entity definition (what is being studied)
 * - Target variable (what is being predicted)
 * - Feature definitions with proper ranges and units
 * - Causal rules (how features relate)
 * - Clinical/business thresholds
 */

const KNOWLEDGE_BASE = {
  
  // ============================================
  // MEDICAL / HEALTHCARE DOMAIN
  // ============================================
  
  diabetes: {
    name: "Diabetes Diagnosis Dataset",
    description: "Clinical data for diabetes screening and diagnosis based on Pima Indians Diabetes dataset patterns",
    entity: "patient",
    context: "clinical_screening",
    
    target: {
      name: "diabetes_diagnosis",
      type: "binary_classification",
      values: ["Negative", "Positive"],
      positive_label: "Positive",
      clinical_definition: {
        positive: "Fasting plasma glucose >= 126 mg/dL OR 2-hour plasma glucose >= 200 mg/dL OR HbA1c >= 6.5%",
        negative: "Fasting plasma glucose < 100 mg/dL AND HbA1c < 5.7%"
      }
    },
    
    features: {
      demographics: [
        { name: "age", type: "integer", range: [21, 81], unit: "years", description: "Patient age in years" },
        { name: "gender", type: "categorical", categories: ["Female", "Male"], description: "Patient gender" },
        { name: "pregnancy_count", type: "integer", range: [0, 17], unit: "count", description: "Number of pregnancies", conditional: "gender == Female" }
      ],
      
      metabolic: [
        { name: "glucose_concentration", type: "float", range: [44, 199], unit: "mg/dL", description: "Plasma glucose concentration (2-hour oral glucose tolerance test)", critical: true },
        { name: "insulin_level", type: "float", range: [0, 846], unit: "mu U/ml", description: "2-Hour serum insulin" },
        { name: "bmi", type: "float", range: [15.0, 67.1], unit: "kg/m²", description: "Body mass index", critical: true }
      ],
      
      cardiovascular: [
        { name: "blood_pressure_systolic", type: "integer", range: [60, 180], unit: "mmHg", description: "Diastolic blood pressure" },
        { name: "blood_pressure_diastolic", type: "integer", range: [40, 120], unit: "mmHg", description: "Systolic blood pressure" }
      ],
      
      pedigree: [
        { name: "pedigree_diabetes_function", type: "float", range: [0.078, 2.42], unit: "score", description: "Diabetes pedigree function (genetic marker)" }
      ]
    },
    
    causal_rules: [
      { feature: "glucose_concentration", condition: "> 126", target_value: "Positive", confidence: 1.0 },
      { feature: "glucose_concentration", condition: "< 100", target_value: "Negative", confidence: 1.0 },
      { feature: "bmi", condition: "> 30", affected: "diabetes_diagnosis", direction: "increases_risk" },
      { feature: "age", condition: "> 45", affected: "diabetes_diagnosis", direction: "increases_risk" }
    ],
    
    statistics: {
      class_distribution: { Negative: 0.65, Positive: 0.35 },
      missing_values: []
    }
  },
  
  heart_disease: {
    name: "Heart Disease Diagnosis Dataset",
    description: "Cardiovascular patient data for heart disease prediction",
    entity: "patient",
    context: "cardiology_clinic",
    
    target: {
      name: "heart_disease_present",
      type: "binary_classification",
      values: ["No", "Yes"],
      positive_label: "Yes"
    },
    
    features: {
      demographics: [
        { name: "age", type: "integer", range: [29, 77], unit: "years", description: "Patient age" },
        { name: "gender", type: "categorical", categories: ["Male", "Female"], description: "Gender (1=Male, 0=Female)" }
      ],
      
      cardiac_exam: [
        { name: "chest_pain_type", type: "categorical", categories: ["Typical Angina", "Atypical Angina", "Non-Anginal Pain", "Asymptomatic"], description: "Chest pain type" },
        { name: "resting_blood_pressure", type: "integer", range: [94, 200], unit: "mmHg", description: "Resting blood pressure" },
        { name: "serum_cholesterol", type: "integer", range: [126, 564], unit: "mg/dL", description: "Serum cholesterol" },
        { name: "fasting_blood_sugar", type: "categorical", categories: ["Greater than 120 mg/dL", "Less than 120 mg/dL"], description: "Fasting blood sugar > 120 mg/dL" },
        { name: "resting_ecg", type: "categorical", categories: ["Normal", "ST-T wave abnormality", "Left ventricular hypertrophy"], description: "Resting electrocardiographic results" }
      ],
      
      stress_test: [
        { name: "maximum_heart_rate", type: "integer", range: [71, 202], unit: "bpm", description: "Maximum heart rate achieved" },
        { name: "exercise_induced_angina", type: "binary", values: ["No", "Yes"], description: "Exercise induced angina" },
        { name: "st_depression", type: "float", range: [0, 6.2], unit: "mm", description: "ST depression induced by exercise relative to rest" },
        { name: "exercise_st_slope", type: "categorical", categories: ["Upsloping", "Flat", "Downsloping"], description: "Slope of peak exercise ST segment" }
      ],
      
      blood_test: [
        { name: "major_vessels_colored", type: "integer", range: [0, 3], unit: "count", description: "Number of major vessels colored by fluoroscopy" },
        { name: "thalassemia", type: "categorical", categories: ["Normal", "Fixed Defect", "Reversible Defect"], description: "Thalassemia" }
      ]
    },
    
    causal_rules: [
      { feature: "age", condition: "> 55", affected: "heart_disease_present", direction: "increases_risk" },
      { feature: "serum_cholesterol", condition: "> 240", affected: "heart_disease_present", direction: "increases_risk" },
      { feature: "maximum_heart_rate", condition: "< 120", affected: "heart_disease_present", direction: "increases_risk" },
      { feature: "chest_pain_type", condition: "Typical Angina", target_value: "Yes", confidence: 0.7 }
    ],
    
    statistics: {
      class_distribution: { No: 0.54, Yes: 0.46 }
    }
  },
  
  breast_cancer: {
    name: "Breast Cancer Diagnosis Dataset",
    description: "Wisconsin Breast Cancer dataset for tumor classification",
    entity: "patient",
    context: "oncology_screening",
    
    target: {
      name: "diagnosis",
      type: "binary_classification",
      values: ["Benign", "Malignant"],
      positive_label: "Malignant"
    },
    
    features: {
      cell_characteristics: [
        { name: "radius_mean", type: "float", range: [6.98, 28.1], unit: "microns", description: "Mean radius of cell nuclei" },
        { name: "texture_mean", type: "float", range: [9.71, 39.3], unit: "gray-scale", description: "Mean texture of cell nuclei" },
        { name: "perimeter_mean", type: "float", range: [43.8, 188], unit: "microns", description: "Mean perimeter of cell nuclei" },
        { name: "area_mean", type: "float", range: [143, 2501], unit: "sq microns", description: "Mean area of cell nuclei" },
        { name: "smoothness_mean", type: "float", range: [0.05, 0.16], unit: "score", description: "Mean smoothness of cell nuclei" },
        { name: "compactness_mean", type: "float", range: [0.02, 0.35], unit: "score", description: "Mean compactness of cell nuclei" },
        { name: "concavity_mean", type: "float", range: [0, 0.43], unit: "score", description: "Mean concavity of cell nuclei" },
        { name: "concave_points_mean", type: "float", range: [0, 0.2], unit: "count", description: "Mean concave points of cell nuclei" },
        { name: "symmetry_mean", type: "float", range: [0.1, 0.3], unit: "score", description: "Mean symmetry of cell nuclei" },
        { name: "fractal_dimension_mean", type: "float", range: [0.05, 0.1], unit: "score", description: "Mean fractal dimension" }
      ],
      
      worst_values: [
        { name: "radius_worst", type: "float", range: [7.93, 36.0], unit: "microns", description: "Worst/largest radius" },
        { name: "texture_worst", type: "float", range: [12.4, 49.5], unit: "gray-scale", description: "Worst texture" },
        { name: "area_worst", type: "float", range: [185, 4254], unit: "sq microns", description: "Worst area" },
        { name: "perimeter_worst", type: "float", range: [50.4, 252], unit: "microns", description: "Worst perimeter" }
      ]
    },
    
    causal_rules: [
      { feature: "area_mean", condition: "> 700", target_value: "Malignant", confidence: 0.8 },
      { feature: "concave_points_mean", condition: "> 0.1", target_value: "Malignant", confidence: 0.85 }
    ],
    
    statistics: {
      class_distribution: { Benign: 0.63, Malignant: 0.37 }
    }
  },
  
  liver_disease: {
    name: "Liver Disease Dataset",
    description: "Indian Liver Patient dataset for liver disorder prediction",
    entity: "patient",
    context: "hepatology_clinic",
    
    target: {
      name: "liver_disease",
      type: "binary_classification",
      values: ["No Disease", "Liver Disease"],
      positive_label: "Liver Disease"
    },
    
    features: {
      demographics: [
        { name: "age", type: "integer", range: [4, 90], unit: "years", description: "Patient age" },
        { name: "gender", type: "categorical", categories: ["Male", "Female"], description: "Gender" }
      ],
      
      liver_function_tests: [
        { name: "total_bilirubin", type: "float", range: [0.4, 75.0], unit: "mg/dL", description: "Total Bilirubin" },
        { name: "direct_bilirubin", type: "float", range: [0.1, 19.7], unit: "mg/dL", description: "Direct Bilirubin" },
        { name: "alkaline_phosphatase", type: "integer", range: [63, 211], unit: "U/L", description: "Alkaline Phosphotase" },
        { name: "alt_alanine_aminotransferase", type: "integer", range: [7, 200], unit: "U/L", description: "Alamine Aminotransferase (ALT)" },
        { name: "ast_aspartate_aminotransferase", type: "integer", range: [10, 200], unit: "U/L", description: "Aspartate Aminotransferase (AST)" },
        { name: "total_proteins", type: "float", range: [45, 113], unit: "g/L", description: "Total Proteins" },
        { name: "albumin", type: "float", range: [1.9, 9.0], unit: "g/dL", description: "Albumin" },
        { name: "albumin_globulin_ratio", type: "float", range: [0.3, 3.0], unit: "ratio", description: "Albumin/Globulin Ratio" }
      ]
    },
    
    causal_rules: [
      { feature: "total_bilirubin", condition: "> 1.2", target_value: "Liver Disease", confidence: 0.7 },
      { feature: "alt_alanine_aminotransferase", condition: "> 40", affected: "liver_disease", direction: "increases_risk" }
    ],
    
    statistics: {
      class_distribution: { "Liver Disease": 0.71, "No Disease": 0.29 }
    }
  },
  
  kidney_disease: {
    name: "Chronic Kidney Disease Dataset",
    description: "Clinical data for chronic kidney disease diagnosis",
    entity: "patient",
    context: "nephrology_clinic",
    
    target: {
      name: "chronic_kidney_disease",
      type: "binary_classification",
      values: ["Not CKD", "CKD"],
      positive_label: "CKD"
    },
    
    features: {
      demographics: [
        { name: "age", type: "integer", range: [2, 90], unit: "years" },
        { name: "blood_pressure", type: "integer", range: [50, 180], unit: "mmHg" }
      ],
      
      kidney_function: [
        { name: "serum_creatinine", type: "float", range: [0.4, 76.0], unit: "mg/dL", description: "Serum Creatinine" },
        { name: "sodium", type: "integer", range: [4.5, 163], unit: "mEq/L", description: "Sodium" },
        { name: "potassium", type: "float", range: [2.5, 47.0], unit: "mEq/L", description: "Potassium" },
        { name: "hemoglobin", type: "float", range: [3.1, 17.8], unit: "g/dL", description: "Hemoglobin" },
        { name: "packed_cell_volume", type: "integer", range: [9.0, 54.0], unit: "%", description: "Packed Cell Volume" },
        { name: "white_blood_cell_count", type: "integer", range: [2200, 26400], unit: "cells/cumm" },
        { name: "red_blood_cell_count", type: "float", range: [2.1, 8.0], unit: "million/uL" }
      ],
      
      urinalysis: [
        { name: "blood_urine", type: "categorical", categories: ["Normal", "Abnormal"], description: "Pus cells" },
        { name: "pus_cell", type: "categorical", categories: ["Normal", "Abnormal"], description: "Pus cells" },
        { name: "bacteria", type: "categorical", categories: ["Not Present", "Present"], description: "Bacteria" }
      ]
    },
    
    statistics: {
      class_distribution: { "Not CKD": 0.38, "CKD": 0.62 }
    }
  },
  
  // ============================================
  // FINANCIAL SERVICES DOMAIN
  // ============================================
  
  credit_card_fraud: {
    name: "Credit Card Fraud Detection Dataset",
    description: "Transaction data for fraudulent activity detection",
    entity: "transaction",
    context: "financial_services",
    
    target: {
      name: "is_fraudulent",
      type: "binary_classification",
      values: ["Legitimate", "Fraud"],
      positive_label: "Fraud"
    },
    
    features: {
      transaction: [
        { name: "transaction_amount", type: "float", range: [0, 28930], unit: "USD", description: "Transaction amount", critical: true },
        { name: "transaction_time", type: "integer", range: [0, 23], unit: "hour", description: "Hour of transaction (0-23)" },
        { name: "distance_from_home", type: "float", range: [0, 11000], unit: "km", description: "Distance from home location" },
        { name: "distance_from_last_transaction", type: "float", range: [0, 12000], unit: "km", description: "Distance from last transaction" }
      ],
      
      card_usage: [
        { name: "used_chip", type: "binary", values: ["No", "Yes"], description: "Used chip card" },
        { name: "used_pin_number", type: "binary", values: ["No", "Yes"], description: "Used PIN number" },
        { name: "online_order", type: "binary", values: ["No", "Yes"], description: "Online order" }
      ],
      
      merchant: [
        { name: "merchant_category", type: "categorical", categories: ["Grocery", "Gas Station", "Entertainment", "Fashion", "Food", "Travel", "Tech", "Other"], description: "Merchant category" }
      ],
      
      account: [
        { name: "account_age_days", type: "integer", range: [0, 3650], unit: "days", description: "Age of account in days" },
        { name: "transaction_count_24h", type: "integer", range: [0, 50], unit: "count", description: "Transaction count in last 24 hours" }
      ]
    },
    
    causal_rules: [
      { feature: "transaction_amount", condition: "> 1000", target_value: "Fraud", confidence: 0.6 },
      { feature: "online_order", condition: "Yes", target_value: "Fraud", confidence: 0.5 },
      { feature: "used_pin_number", condition: "No", target_value: "Fraud", confidence: 0.4 },
      { feature: "transaction_count_24h", condition: "> 10", target_value: "Fraud", confidence: 0.5 }
    ],
    
    statistics: {
      class_distribution: { Legitimate: 0.966, Fraud: 0.034 },
      note: "Highly imbalanced - fraud is rare"
    }
  },
  
  loan_default: {
    name: "Loan Default Prediction Dataset",
    description: "Loan application data for default prediction",
    entity: "loan_application",
    context: "lending_services",
    
    target: {
      name: "loan_default",
      type: "binary_classification",
      values: ["No Default", "Default"],
      positive_label: "Default"
    },
    
    features: {
      applicant: [
        { name: "applicant_age", type: "integer", range: [18, 70], unit: "years" },
        { name: "employment_length", type: "integer", range: [0, 41], unit: "years" },
        { name: "home_ownership", type: "categorical", categories: ["Rent", "Own", "Mortgage", "Other"], description: "Home ownership status" },
        { name: "annual_income", type: "integer", range: [4000, 7500000], unit: "USD" }
      ],
      
      loan: [
        { name: "loan_amount", type: "integer", range: [500, 40000], unit: "USD" },
        { name: "loan_intent", type: "categorical", categories: ["Education", "Medical", "Venture", "Personal", "Debt Consolidation", "Home Improvement"], description: "Purpose of loan" },
        { name: "loan_interest_rate", type: "float", range: [5.0, 23.0], unit: "%" },
        { name: "loan_term_months", type: "integer", range: [6, 120], unit: "months" }
      ],
      
      financial: [
        { name: "credit_score", type: "integer", range: [300, 850], unit: "score", description: "Credit score" },
        { name: "credit_history_length", type: "integer", range: [2, 30], unit: "years" },
        { name: "debt_to_income_ratio", type: "float", range: [0, 40], unit: "ratio", description: "Monthly debt payments / gross income" },
        { name: "previous_loan_defaults", type: "integer", range: [0, 10], unit: "count" }
      ],
      
      behavior: [
        { name: "payment_on_time_ratio", type: "float", range: [0, 1], unit: "ratio", description: "Historical payment on time ratio" }
      ]
    },
    
    causal_rules: [
      { feature: "credit_score", condition: "< 580", target_value: "Default", confidence: 0.7 },
      { feature: "debt_to_income_ratio", condition: "> 0.35", target_value: "Default", confidence: 0.6 },
      { feature: "previous_loan_defaults", condition: "> 0", target_value: "Default", confidence: 0.5 },
      { feature: "payment_on_time_ratio", condition: "< 0.8", target_value: "Default", confidence: 0.6 }
    ],
    
    statistics: {
      class_distribution: { "No Default": 0.80, "Default": 0.20 }
    }
  },
  
  insurance_claim: {
    name: "Insurance Claim Prediction Dataset",
    description: "Customer data for predicting insurance claims",
    entity: "customer",
    context: "insurance",
    
    target: {
      name: "claim_filed",
      type: "binary_classification",
      values: ["No Claim", "Claim Filed"],
      positive_label: "Claim Filed"
    },
    
    features: {
      demographics: [
        { name: "age", type: "integer", range: [18, 65], unit: "years" },
        { name: "gender", type: "categorical", categories: ["Male", "Female"] },
        { name: "marital_status", type: "categorical", categories: ["Single", "Married", "Divorced"] },
        { name: "dependents", type: "integer", range: [0, 5], unit: "count" },
        { name: "education_level", type: "categorical", categories: ["High School", "Bachelor", "Master", "PhD"] }
      ],
      
      policy: [
        { name: "policy_type", type: "categorical", categories: ["Basic", "Extended", "Premium"], description: "Insurance policy type" },
        { name: "coverage_amount", type: "integer", range: [50000, 1000000], unit: "USD" },
        { name: "premium_monthly", type: "integer", range: [50, 500], unit: "USD" },
        { name: "policy_start_date", type: "date", range: ["2010-01-01", "2024-01-01"] }
      ],
      
      risk_factors: [
        { name: "vehicle_age", type: "integer", range: [0, 20], unit: "years" },
        { name: "vehicle_type", type: "categorical", categories: ["Sedan", "SUV", "Truck", "Sports", "Luxury"] },
        { name: "annual_mileage", type: "integer", range: [5000, 50000], unit: "miles" },
        { name: "accident_history", type: "integer", range: [0, 5], unit: "count", description: "Prior accidents in 5 years" },
        { name: "safety_rating", type: "integer", range: [1, 5], unit: "score" }
      ],
      
      claims: [
        { name: "previous_claims", type: "integer", range: [0, 10], unit: "count" },
        { name: "claim_amount_history", type: "float", range: [0, 50000], unit: "USD" }
      ]
    },
    
    causal_rules: [
      { feature: "accident_history", condition: "> 0", target_value: "Claim Filed", confidence: 0.6 },
      { feature: "vehicle_age", condition: "> 10", target_value: "Claim Filed", confidence: 0.5 },
      { feature: "previous_claims", condition: "> 2", target_value: "Claim Filed", confidence: 0.7 }
    ],
    
    statistics: {
      class_distribution: { "No Claim": 0.85, "Claim Filed": 0.15 }
    }
  },
  
  // ============================================
  // E-COMMERCE / RETAIL DOMAIN
  // ============================================
  
  customer_churn: {
    name: "Customer Churn Prediction Dataset",
    description: "Telecom customer data for churn prediction",
    entity: "customer",
    context: "telecom",
    
    target: {
      name: "churn_status",
      type: "binary_classification",
      values: ["Retained", "Churned"],
      positive_label: "Churned"
    },
    
    features: {
      demographics: [
        { name: "customer_age", type: "integer", range: [18, 80], unit: "years" },
        { name: "gender", type: "categorical", categories: ["Male", "Female"] },
        { name: "senior_citizen", type: "binary", values: ["No", "Yes"] },
        { name: "partner", type: "binary", values: ["No", "Yes"], description: "Has partner" },
        { name: "dependents", type: "binary", values: ["No", "Yes"], description: "Has dependents" }
      ],
      
      subscription: [
        { name: "tenure_months", type: "integer", range: [0, 72], unit: "months", description: "Months as customer", critical: true },
        { name: "contract_type", type: "categorical", categories: ["Month-to-Month", "One Year", "Two Year"], critical: true },
        { name: "paperless_billing", type: "binary", values: ["No", "Yes"] }
      ],
      
      services: [
        { name: "phone_service", type: "binary", values: ["No", "Yes"] },
        { name: "multiple_lines", type: "binary", values: ["No", "Yes"] },
        { name: "internet_service", type: "categorical", categories: ["DSL", "Fiber Optic", "No"] },
        { name: "online_security", type: "binary", values: ["No", "Yes"] },
        { name: "online_backup", type: "binary", values: ["No", "Yes"] },
        { name: "device_protection", type: "binary", values: ["No", "Yes"] },
        { name: "tech_support", type: "binary", values: ["No", "Yes"] },
        { name: "streaming_tv", type: "binary", values: ["No", "Yes"] },
        { name: "streaming_movies", type: "binary", values: ["No", "Yes"] }
      ],
      
      billing: [
        { name: "monthly_charges", type: "float", range: [18, 119], unit: "USD" },
        { name: "total_charges", type: "float", range: [0, 9500], unit: "USD" },
        { name: "average_monthly_charge", type: "float", range: [18, 120], unit: "USD" }
      ]
    },
    
    causal_rules: [
      { feature: "tenure_months", condition: "< 12", target_value: "Churned", confidence: 0.6 },
      { feature: "contract_type", condition: "Month-to-Month", target_value: "Churned", confidence: 0.7 },
      { feature: "internet_service", condition: "Fiber Optic", target_value: "Churned", confidence: 0.4 },
      { feature: "online_security", condition: "No", target_value: "Churned", confidence: 0.5 },
      { feature: "tech_support", condition: "No", target_value: "Churned", confidence: 0.5 }
    ],
    
    statistics: {
      class_distribution: { Retained: 0.73, Churned: 0.27 }
    }
  },
  
  market_basket: {
    name: "Market Basket Analysis Dataset",
    description: "Transactional data for product association analysis",
    entity: "transaction",
    context: "retail",
    
    target: {
      name: "product_category",
      type: "multi_class_classification",
      values: ["Fresh Produce", "Dairy", "Bakery", "Meat", "Frozen", "Beverages", "Snacks", "Household", "Personal Care"],
      multi_label: true
    },
    
    features: {
      transaction: [
        { name: "transaction_id", type: "uuid", description: "Unique transaction ID" },
        { name: "day_of_week", type: "integer", range: [0, 6], unit: "day" },
        { name: "time_of_day", type: "categorical", categories: ["Morning", "Afternoon", "Evening", "Night"] },
        { name: "total_items", type: "integer", range: [1, 50], unit: "count" },
        { name: "total_spend", type: "float", range: [3, 500], unit: "USD" }
      ],
      
      customer: [
        { name: "customer_type", type: "categorical", categories: ["Regular", "New", "VIP"] },
        { name: "basket_size", type: "categorical", categories: ["Small", "Medium", "Large"], description: "Number of items" },
        { name: "use_coupon", type: "binary", values: ["No", "Yes"] }
      ],
      
      product: [
        { name: "product_id", type: "categorical", description: "Product category" },
        { name: "unit_price", type: "float", range: [0.5, 50], unit: "USD" },
        { name: "quantity", type: "integer", range: [1, 10], unit: "count" }
      ]
    },
    
    causal_rules: [
      { feature: "basket_size", condition: "Large", associated_with: "use_coupon = Yes", confidence: 0.6 }
    ],
    
    statistics: {}
  },
  
  // ============================================
  // EDUCATION DOMAIN
  // ============================================
  
  student_performance: {
    name: "Student Performance Dataset",
    description: "Student data for academic performance prediction",
    entity: "student",
    context: "education",
    
    target: {
      name: "pass_status",
      type: "binary_classification",
      values: ["Fail", "Pass"],
      positive_label: "Pass"
    },
    
    features: {
      demographics: [
        { name: "student_age", type: "integer", range: [15, 22], unit: "years" },
        { name: "gender", type: "categorical", categories: ["Male", "Female"] },
        { name: "family_size", type: "categorical", categories: ["LE3", "GT3"], description: "Family size (Less/Greater than 3)" },
        { name: "parent_cohabitation", type: "categorical", categories: ["Living with both", "Living with one", "Alone"] }
      ],
      
      academic: [
        { name: "study_time_weekly", type: "float", range: [1, 22], unit: "hours", description: "Weekly study time" },
        { name: "previous_semester_grade", type: "float", range: [0, 20], unit: "score", description: "Previous semester grade" },
        { name: "attendance_rate", type: "integer", range: [50, 100], unit: "%" },
        { name: "midterm_score", type: "integer", range: [0, 100], unit: "score" },
        { name: "homework_completion", type: "float", range: [0, 100], unit: "%" }
      ],
      
      behavior: [
        { name: "absences", type: "integer", range: [0, 30], unit: "count" },
        { name: "extracurricular", type: "binary", values: ["No", "Yes"] },
        { name: "part_time_job", type: "binary", values: ["No", "Yes"] }
      ],
      
      family: [
        { name: "mother_education", type: "categorical", categories: ["None", "Primary", "Secondary", "Higher"], description: "Mother's education level" },
        { name: "father_education", type: "categorical", categories: ["None", "Primary", "Secondary", "Higher"], description: "Father's education level" },
        { name: "mother_job", type: "categorical", categories: ["Teacher", "Health", "Services", "At Home", "Other"] },
        { name: "father_job", type: "categorical", categories: ["Teacher", "Health", "Services", "At Home", "Other"] }
      ],
      
      social: [
        { name: "family_support", type: "categorical", categories: ["Low", "Medium", "High"], description: "Family educational support" },
        { name: "peer_influence", type: "categorical", categories: ["Negative", "Neutral", "Positive"] },
        { name: "romantic_relationship", type: "binary", values: ["No", "Yes"] },
        { name: "alcohol_weekend", type: "categorical", categories: ["Very Low", "Low", "Medium", "High", "Very High"] }
      ]
    },
    
    causal_rules: [
      { feature: "study_time_weekly", condition: "> 10", target_value: "Pass", confidence: 0.7 },
      { feature: "attendance_rate", condition: "> 90", target_value: "Pass", confidence: 0.6 },
      { feature: "midterm_score", condition: "> 60", target_value: "Pass", confidence: 0.8 },
      { feature: "absences", condition: "> 10", target_value: "Fail", confidence: 0.6 },
      { feature: "family_support", condition: "High", target_value: "Pass", confidence: 0.5 }
    ],
    
    statistics: {
      class_distribution: { Pass: 0.67, Fail: 0.33 }
    }
  },
  
  // ============================================
  // HUMAN RESOURCES DOMAIN
  // ============================================
  
  employee_attrition: {
    name: "Employee Attrition Dataset",
    description: "HR data for employee turnover prediction",
    entity: "employee",
    context: "human_resources",
    
    target: {
      name: "attrition",
      type: "binary_classification",
      values: ["Stayed", "Left"],
      positive_label: "Left"
    },
    
    features: {
      demographics: [
        { name: "age", type: "integer", range: [18, 60], unit: "years" },
        { name: "gender", type: "categorical", categories: ["Male", "Female"] },
        { name: "marital_status", type: "categorical", categories: ["Single", "Married", "Divorced"] },
        { name: "education", type: "categorical", categories: ["Below College", "College", "Bachelor", "Master", "Doctor"] },
        { name: "distance_from_home", type: "integer", range: [1, 30], unit: "km" }
      ],
      
      job: [
        { name: "department", type: "categorical", categories: ["Sales", "Research & Development", "Human Resources"] },
        { name: "job_role", type: "categorical", categories: ["Sales Executive", "Research Scientist", "Laboratory Technician", "Manufacturing Director", "Healthcare Representative", "Manager", "Sales Representative", "Human Resources"] },
        { name: "job_level", type: "integer", range: [1, 5], unit: "level" },
        { name: "job_satisfaction", type: "integer", range: [1, 4], unit: "level", description: "Job satisfaction level" }
      ],
      
      compensation: [
        { name: "monthly_income", type: "integer", range: [1000, 20000], unit: "USD" },
        { name: "hourly_rate", type: "integer", range: [30, 150], unit: "USD" },
        { name: "percent_salary_hike", type: "float", range: [0, 25], unit: "%" },
        { name: "stock_option_level", type: "integer", range: [0, 3], unit: "level" }
      ],
      
      career: [
        { name: "years_at_company", type: "integer", range: [0, 40], unit: "years" },
        { name: "years_in_role", type: "integer", range: [0, 20], unit: "years" },
        { name: "years_since_promotion", type: "integer", range: [0, 15], unit: "years" },
        { name: "total_working_years", type: "integer", range: [0, 40], unit: "years" },
        { name: "training_times_last_year", type: "integer", range: [0, 6], unit: "count" }
      ],
      
      performance: [
        { name: "performance_rating", type: "integer", range: [1, 4], unit: "rating" },
        { name: "work_life_balance", type: "integer", range: [1, 4], unit: "rating" },
        { name: "overtime", type: "binary", values: ["No", "Yes"] },
        { name: "business_travel", type: "categorical", categories: ["Non-Travel", "Travel Rarely", "Travel Frequently"] }
      ]
    },
    
    causal_rules: [
      { feature: "job_satisfaction", condition: "1", target_value: "Left", confidence: 0.6 },
      { feature: "work_life_balance", condition: "1", target_value: "Left", confidence: 0.5 },
      { feature: "overtime", condition: "Yes", target_value: "Left", confidence: 0.4 },
      { feature: "years_at_company", condition: "< 2", target_value: "Left", confidence: 0.5 },
      { feature: "distance_from_home", condition: "> 20", target_value: "Left", confidence: 0.4 },
      { feature: "attrition", condition: "Low", target_value: "Stayed", confidence: 0.7 }
    ],
    
    statistics: {
      class_distribution: { Stayed: 0.84, Left: 0.16 }
    }
  },
  
  // ============================================
  // MANUFACTURING / ENGINEERING DOMAIN
  // ============================================
  
  machine_maintenance: {
    name: "Predictive Maintenance Dataset",
    description: "Machine sensor data for predictive maintenance",
    entity: "machine",
    context: "manufacturing",
    
    target: {
      name: "machine_failure",
      type: "binary_classification",
      values: ["No Failure", "Failure"],
      positive_label: "Failure"
    },
    
    features: {
      machine: [
        { name: "machine_id", type: "uuid" },
        { name: "machine_type", type: "categorical", categories: ["L", "M", "H"], description: "Type: Low/Medium/High quality" },
        { name: "machine_age", type: "integer", range: [0, 20], unit: "years" },
        { name: "product_id", type: "categorical", description: "Product variant code" }
      ],
      
      sensor_readings: [
        { name: "air_temp", type: "float", range: [295, 305], unit: "K", description: "Air temperature in Kelvin" },
        { name: "process_temp", type: "float", range: [305, 315], unit: "K", description: "Process temperature in Kelvin" },
        { name: "rotational_speed", type: "integer", range: [1100, 1800], unit: "rpm", description: "Rotational speed" },
        { name: "torque", type: "float", range: [25, 80], unit: "Nm", description: "Tool torque force" },
        { name: "tool_wear", type: "integer", range: [0, 250], unit: "minutes", description: "Tool wear time" }
      ],
      
      product_quality: [
        { name: "product_quality", type: "categorical", categories: ["Low", "Medium", "High"], description: "Quality variant" },
        { name: "failure_type", type: "categorical", categories: ["No Failure", "Heat Dissipation Failure", "Power Failure", "Overstrain Failure", "Tool Wear Failure", "Random Failures"] }
      ],
      
      operational: [
        { name: "operation_count", type: "integer", range: [1, 300], unit: "count" },
        { name: "processing_time", type: "float", range: [3, 10], unit: "seconds" },
        { name: "downtime_hours", type: "float", range: [0, 24], unit: "hours" }
      ]
    },
    
    causal_rules: [
      { feature: "tool_wear", condition: "> 200", target_value: "Failure", confidence: 0.7 },
      { feature: "torque", condition: "> 70", target_value: "Failure", confidence: 0.6 },
      { feature: "rotational_speed", condition: "< 1200", target_value: "Failure", confidence: 0.4 },
      { feature: "air_temp", condition: "> 300", affected: "machine_failure", direction: "increases_risk" }
    ],
    
    statistics: {
      class_distribution: { "No Failure": 0.97, Failure: 0.03 }
    }
  },
  
  // ============================================
  // ENVIRONMENTAL / IoT DOMAIN
  // ============================================
  
  sensor_monitoring: {
    name: "IoT Sensor Monitoring Dataset",
    description: "Environmental sensor data for anomaly detection",
    entity: "sensor_reading",
    context: "iot_monitoring",
    
    target: {
      name: "anomaly_detected",
      type: "binary_classification",
      values: ["Normal", "Anomaly"],
      positive_label: "Anomaly"
    },
    
    features: {
      timestamp: [
        { name: "timestamp", type: "datetime", range: ["2020-01-01", "2024-12-31"] },
        { name: "hour_of_day", type: "integer", range: [0, 23], unit: "hour" },
        { name: "day_of_week", type: "integer", range: [0, 6], unit: "day" }
      ],
      
      environment: [
        { name: "temperature", type: "float", range: [-20, 50], unit: "Celsius" },
        { name: "humidity", type: "float", range: [0, 100], unit: "%" },
        { name: "pressure", type: "float", range: [980, 1050], unit: "hPa", description: "Atmospheric pressure" },
        { name: "air_quality_index", type: "integer", range: [0, 500], unit: "AQI" }
      ],
      
      air_quality: [
        { name: "pm2_5", type: "float", range: [0, 500], unit: "ug/m3", description: "Particulate matter 2.5" },
        { name: "pm10", type: "float", range: [0, 500], unit: "ug/m3", description: "Particulate matter 10" },
        { name: "no2", type: "float", range: [0, 200], unit: "ppb", description: "Nitrogen dioxide" },
        { name: "co", type: "float", range: [0, 10], unit: "ppm", description: "Carbon monoxide" },
        { name: "o3", type: "float", range: [0, 200], unit: "ppb", description: "Ozone" }
      ],
      
      location: [
        { name: "latitude", type: "float", range: [-90, 90], unit: "degrees" },
        { name: "longitude", type: "float", range: [-180, 180], unit: "degrees" },
        { name: "sensor_id", type: "categorical", description: "Sensor identifier" }
      ]
    },
    
    causal_rules: [
      { feature: "pm2_5", condition: "> 150", target_value: "Anomaly", confidence: 0.5 },
      { feature: "co", condition: "> 5", target_value: "Anomaly", confidence: 0.6 },
      { feature: "temperature", condition: "> 45", target_value: "Anomaly", confidence: 0.5 }
    ],
    
    statistics: {
      class_distribution: { Normal: 0.95, Anomaly: 0.05 }
    }
  }
};

/**
 * Topic Matcher
 * Matches user input to knowledge base topics using semantic similarity
 */

function matchTopic(userTopic) {
  const topic = userTopic.toLowerCase().trim();
  const topicWords = topic.split(/\s+/);
  
  const scores = {};
  
  for (const [key, config] of Object.entries(KNOWLEDGE_BASE)) {
    let score = 0;
    const configName = config.name.toLowerCase();
    const configDesc = config.description.toLowerCase();
    
    // Exact match
    if (key === topic || configName.includes(topic) || topic.includes(key)) {
      score = 100;
    } else {
      // Word matching
      for (const word of topicWords) {
        if (configName.includes(word)) score += 10;
        if (configDesc.includes(word)) score += 5;
        if (key.includes(word)) score += 15;
        
        // Semantic matching
        const semanticTerms = getSemanticTerms(key);
        for (const term of semanticTerms) {
          if (term.includes(word) || word.includes(term)) {
            score += 8;
          }
        }
      }
    }
    
    scores[key] = score;
  }
  
  // Sort by score
  const sorted = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);
  
  if (sorted.length === 0) {
    return null;
  }
  
  const bestMatch = sorted[0][0];
  const confidence = sorted[0][1] / 100;
  
  return {
    topic: bestMatch,
    confidence,
    config: KNOWLEDGE_BASE[bestMatch],
    alternatives: sorted.slice(1, 4).map(([key, score]) => ({
      topic: key,
      score,
      config: KNOWLEDGE_BASE[key]
    }))
  };
}

function getSemanticTerms(topicKey) {
  const semanticMap = {
    diabetes: ['blood sugar', 'glucose', 'insulin', 'pima'],
    heart_disease: ['cardiac', 'cardiovascular', 'coronary', 'heart attack'],
    breast_cancer: ['tumor', 'malignant', 'oncology', 'carcinoma'],
    liver_disease: ['hepatitis', 'hepatic', 'liver disorder'],
    kidney_disease: ['renal', 'nephrology', 'chronic kidney'],
    credit_card_fraud: ['fraud detection', 'transaction fraud', 'credit card'],
    loan_default: ['lending', 'credit risk', 'borrower'],
    insurance_claim: ['insurance', 'claim prediction'],
    customer_churn: ['customer turnover', 'subscriber churn', 'retention'],
    market_basket: ['retail', 'transaction analysis', 'association rules'],
    student_performance: ['academic', 'education', 'student success'],
    employee_attrition: ['turnover', 'hr analytics', 'workforce'],
    machine_maintenance: ['predictive maintenance', 'equipment failure', 'manufacturing'],
    sensor_monitoring: ['iot', 'environmental monitoring', 'anomaly detection']
  };
  
  return semanticMap[topicKey] || [];
}

function getAllTopics() {
  return Object.entries(KNOWLEDGE_BASE).map(([key, config]) => ({
    key,
    name: config.name,
    description: config.description,
    entity: config.entity,
    context: config.context
  }));
}

module.exports = {
  KNOWLEDGE_BASE,
  matchTopic,
  getSemanticTerms,
  getAllTopics
};
