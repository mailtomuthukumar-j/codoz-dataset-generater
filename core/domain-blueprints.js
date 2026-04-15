/**
 * CODOZ Domain Blueprints
 * 
 * Hardcoded schemas for each domain - scraping enriches these, NEVER replaces them.
 * Every column has domain-specific meaning. No generic columns allowed.
 */

const DOMAIN_BLUEPRINTS = {
  medical: {
    heart_disease: {
      columns: ['age', 'gender', 'chest_pain_type', 'resting_blood_pressure', 'serum_cholesterol', 'fasting_blood_sugar', 'resting_ecg', 'maximum_heart_rate', 'exercise_induced_angina', 'st_depression', 'exercise_st_slope', 'major_vessels_colored', 'thalassemia'],
      target: 'heart_disease_present',
      targetClasses: ['Yes', 'No'],
      idField: 'patient_id',
      featureConstraints: {
        age: { min: 29, max: 77, type: 'integer' },
        resting_blood_pressure: { min: 94, max: 200, type: 'integer' },
        serum_cholesterol: { min: 126, max: 564, type: 'integer' },
        maximum_heart_rate: { min: 71, max: 202, type: 'integer', derived: (age) => ({ min: 220 - age - 12, max: 220 - age + 12 }) },
        st_depression: { min: 0, max: 6.2, type: 'float' },
        major_vessels_colored: { min: 0, max: 3, type: 'integer' },
        chest_pain_type: { type: 'categorical', values: ['Typical Angina', 'Atypical Angina', 'Non-Anginal Pain', 'Asymptomatic'] },
        fasting_blood_sugar: { type: 'categorical', values: ['Less than 120 mg/dL', 'Greater than 120 mg/dL'] },
        resting_ecg: { type: 'categorical', values: ['Normal', 'ST-T wave abnormality', 'Left ventricular hypertrophy'] },
        exercise_induced_angina: { type: 'categorical', values: ['Yes', 'No'] },
        exercise_st_slope: { type: 'categorical', values: ['Upsloping', 'Flat', 'Downsloping'] },
        thalassemia: { type: 'categorical', values: ['Normal', 'Fixed Defect', 'Reversible Defect'] }
      },
      contradictions: [
        { condition: 'heart_disease_present=Yes AND maximum_heart_rate > (220 - age + 15)', invalid: true },
        { condition: 'heart_disease_present=Yes AND thalassemia=Normal AND major_vessels_colored=0 AND chest_pain_type=Asymptomatic', invalid: true },
        { condition: 'resting_blood_pressure < 80 OR resting_blood_pressure > 200', invalid: true },
        { condition: 'maximum_heart_rate < (220 - age - 20)', invalid: true }
      ],
      labelRules: [
        { indicators: ['chest_pain_type=Asymptomatic', 'exercise_induced_angina=Yes', 'exercise_st_slope=Downsloping'], target: 'Yes', weight: 0.8 },
        { indicators: ['major_vessels_colored > 0', 'thalassemia=Fixed Defect'], target: 'Yes', weight: 0.75 },
        { indicators: ['chest_pain_type=Typical Angina', 'st_depression > 1.5'], target: 'Yes', weight: 0.7 },
        { indicators: ['chest_pain_type=Asymptomatic', 'resting_ecg=Normal', 'thalassemia=Normal', 'major_vessels_colored=0'], target: 'No', weight: 0.85 },
        { indicators: ['maximum_heart_rate > (220 - age - 10)', 'chest_pain_type=Non-Anginal Pain'], target: 'No', weight: 0.7 }
      ]
    },
    
    diabetes: {
      columns: ['age', 'gender', 'pregnancy_count', 'glucose_concentration', 'insulin_level', 'bmi', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'pedigree_diabetes_function'],
      target: 'diabetes_diagnosis',
      targetClasses: ['Positive', 'Negative'],
      idField: 'patient_id',
      featureConstraints: {
        age: { min: 21, max: 81, type: 'integer' },
        gender: { type: 'categorical', values: ['Male', 'Female'] },
        pregnancy_count: { min: 0, max: 17, type: 'integer' },
        glucose_concentration: { min: 44, max: 199, type: 'float' },
        insulin_level: { min: 0, max: 846, type: 'float' },
        bmi: { min: 15.0, max: 67.1, type: 'float' },
        blood_pressure_systolic: { min: 60, max: 180, type: 'integer' },
        blood_pressure_diastolic: { min: 40, max: 120, type: 'integer' },
        pedigree_diabetes_function: { min: 0.078, max: 2.42, type: 'float' }
      },
      contradictions: [
        { condition: 'gender=Male AND pregnancy_count > 2', invalid: true },
        { condition: 'glucose_concentration < 70 AND diabetes_diagnosis=Positive', invalid: true },
        { condition: 'bmi < 18 AND diabetes_diagnosis=Positive AND glucose_concentration > 160', caution: true }
      ],
      labelRules: [
        { indicators: ['glucose_concentration >= 160'], target: 'Positive', weight: 0.75 },
        { indicators: ['glucose_concentration >= 130', 'bmi >= 32'], target: 'Positive', weight: 0.7 },
        { indicators: ['glucose_concentration >= 140'], target: 'Positive', weight: 0.65 },
        { indicators: ['glucose_concentration < 110', 'bmi < 27'], target: 'Negative', weight: 0.8 },
        { indicators: ['age < 35', 'bmi < 25', 'glucose_concentration < 120'], target: 'Negative', weight: 0.75 }
      ]
    },
    
    breast_cancer: {
      columns: ['radius_mean', 'texture_mean', 'perimeter_mean', 'area_mean', 'smoothness_mean', 'compactness_mean', 'concavity_mean', 'concave_points_mean', 'symmetry_mean', 'fractal_dimension_mean'],
      target: 'diagnosis',
      targetClasses: ['Benign', 'Malignant'],
      idField: 'sample_id',
      featureConstraints: {
        radius_mean: { min: 6.98, max: 28.1, type: 'float' },
        texture_mean: { min: 9.71, max: 39.3, type: 'float' },
        perimeter_mean: { min: 43.8, max: 188, type: 'float' },
        area_mean: { min: 143, max: 2501, type: 'float' },
        smoothness_mean: { min: 0.05, max: 0.16, type: 'float' },
        compactness_mean: { min: 0.02, max: 0.35, type: 'float' },
        concavity_mean: { min: 0, max: 0.43, type: 'float' },
        concave_points_mean: { min: 0, max: 0.2, type: 'float' },
        symmetry_mean: { min: 0.1, max: 0.3, type: 'float' },
        fractal_dimension_mean: { min: 0.05, max: 0.1, type: 'float' }
      },
      contradictions: [],
      labelRules: [
        { indicators: ['area_mean >= 800', 'concave_points_mean >= 0.12'], target: 'Malignant', weight: 0.9 },
        { indicators: ['radius_mean >= 20'], target: 'Malignant', weight: 0.85 },
        { indicators: ['compactness_mean >= 0.15', 'concavity_mean >= 0.2'], target: 'Malignant', weight: 0.82 },
        { indicators: ['area_mean < 500', 'radius_mean < 14', 'concave_points_mean < 0.06'], target: 'Benign', weight: 0.92 }
      ]
    },
    
    kidney_disease: {
      columns: ['age', 'blood_pressure', 'specific_gravity', 'albumin', 'sugar', 'red_blood_cells', 'pus_cells', 'blood_glucose_random', 'blood_urea', 'serum_creatinine', 'sodium', 'potassium', 'hemoglobin', 'packed_cell_volume', 'white_blood_cell_count', 'red_blood_cell_count'],
      target: 'chronic_kidney_disease',
      targetClasses: ['CKD', 'Not CKD'],
      idField: 'patient_id',
      featureConstraints: {
        age: { min: 2, max: 90, type: 'integer' },
        blood_pressure: { min: 50, max: 180, type: 'integer' },
        blood_glucose_random: { min: 70, max: 490, type: 'float' },
        blood_urea: { min: 1.5, max: 391, type: 'float' },
        serum_creatinine: { min: 0.4, max: 76.0, type: 'float' },
        hemoglobin: { min: 3.1, max: 17.8, type: 'float' }
      },
      contradictions: [],
      labelRules: [
        { indicators: ['serum_creatinine >= 1.5'], target: 'CKD', weight: 0.9 },
        { indicators: ['hemoglobin < 11', 'blood_glucose_random > 140'], target: 'CKD', weight: 0.85 },
        { indicators: ['serum_creatinine < 1.2', 'hemoglobin >= 12'], target: 'Not CKD', weight: 0.9 }
      ]
    }
  },
  
  financial: {
    loan_default: {
      columns: ['credit_score', 'credit_history_length', 'debt_to_income_ratio', 'previous_loan_defaults', 'payment_on_time_ratio', 'applicant_age', 'employment_length', 'home_ownership', 'annual_income', 'loan_amount', 'loan_intent', 'loan_interest_rate', 'loan_term_months'],
      target: 'loan_status',
      targetClasses: ['Default', 'No Default'],
      idField: 'application_id',
      featureConstraints: {
        credit_score: { min: 300, max: 850, type: 'integer' },
        credit_history_length: { min: 0, max: 30, type: 'integer', unit: 'years' },
        debt_to_income_ratio: { min: 0, max: 60, type: 'float', unit: 'percent' },
        previous_loan_defaults: { min: 0, max: 10, type: 'integer' },
        payment_on_time_ratio: { min: 0, max: 1, type: 'float' },
        applicant_age: { min: 18, max: 75, type: 'integer' },
        employment_length: { min: 0, max: 41, type: 'integer', unit: 'years' },
        annual_income: { min: 4000, max: 200000, type: 'integer' },
        loan_amount: { min: 500, max: 40000, type: 'integer' },
        loan_interest_rate: { min: 2, max: 24, type: 'float', unit: 'percent' },
        loan_term_months: { min: 6, max: 60, type: 'integer' }
      },
      contradictions: [
        { condition: 'credit_score < 400 AND loan_status=No Default', requiresCompensation: true },
        { condition: 'loan_amount > annual_income', caution: true }
      ],
      labelRules: [
        { indicators: ['credit_score < 580', 'previous_loan_defaults > 0'], target: 'Default', weight: 0.85 },
        { indicators: ['debt_to_income_ratio > 43', 'payment_on_time_ratio < 0.7'], target: 'Default', weight: 0.8 },
        { indicators: ['credit_score > 720', 'previous_loan_defaults=0', 'debt_to_income_ratio < 36'], target: 'No Default', weight: 0.9 }
      ]
    },
    
    credit_card_fraud: {
      columns: ['transaction_id', 'transaction_amount', 'transaction_time', 'distance_from_home', 'distance_from_last_transaction', 'merchant_category', 'account_age_days', 'transaction_count_24h', 'used_chip', 'used_pin_number', 'online_order'],
      target: 'is_fraudulent',
      targetClasses: ['Legitimate', 'Fraudulent'],
      idField: 'transaction_id',
      featureConstraints: {
        transaction_amount: { min: 0, max: 10000, type: 'float' },
        transaction_time: { min: 0, max: 24, type: 'float', unit: 'hours' },
        distance_from_home: { min: 0, max: 10000, type: 'float', unit: 'km' },
        distance_from_last_transaction: { min: 0, max: 10000, type: 'float', unit: 'km' },
        account_age_days: { min: 0, max: 3650, type: 'integer' },
        transaction_count_24h: { min: 0, max: 100, type: 'integer' }
      },
      contradictions: [
        { condition: 'is_fraudulent=Legitimate AND distance_from_home > 2000 AND online_order=true AND used_chip=false', invalid: true }
      ],
      labelRules: [
        { indicators: ['distance_from_home > 500', 'online_order=true', 'used_chip=false', 'used_pin_number=false'], target: 'Fraudulent', weight: 0.85 },
        { indicators: ['transaction_count_24h > 20', 'account_age_days < 90'], target: 'Fraudulent', weight: 0.8 },
        { indicators: ['used_chip=true', 'used_pin_number=true', 'distance_from_home < 50'], target: 'Legitimate', weight: 0.9 }
      ]
    }
  },
  
  hr: {
    employee_attrition: {
      columns: ['employee_id', 'age', 'gender', 'marital_status', 'education', 'distance_from_home', 'department', 'job_role', 'job_level', 'job_satisfaction', 'monthly_income', 'hourly_rate', 'percent_salary_hike', 'stock_option_level', 'years_at_company', 'years_in_role', 'years_since_promotion', 'total_working_years', 'training_times_last_year', 'performance_rating', 'work_life_balance', 'overtime', 'business_travel'],
      target: 'attrition',
      targetClasses: ['Left', 'Retained'],
      idField: 'employee_id',
      featureConstraints: {
        age: { min: 18, max: 60, type: 'integer' },
        job_level: { min: 1, max: 5, type: 'integer' },
        monthly_income: { min: 1000, max: 30000, type: 'integer' },
        years_at_company: { min: 0, max: 40, type: 'integer' },
        years_in_role: { min: 0, max: 40, type: 'integer' },
        years_since_promotion: { min: 0, max: 15, type: 'integer' },
        total_working_years: { min: 0, max: 45, type: 'integer' },
        job_satisfaction: { min: 1, max: 4, type: 'integer' },
        performance_rating: { min: 1, max: 4, type: 'integer' },
        work_life_balance: { min: 1, max: 4, type: 'integer' }
      },
      contradictions: [
        { condition: 'job_role=Manager AND job_level=1', invalid: true },
        { condition: 'monthly_income < 1500', invalid: true },
        { condition: 'years_in_role > years_at_company', invalid: true },
        { condition: 'years_at_company > total_working_years', invalid: true },
        { condition: 'job_level=1 AND monthly_income > 4000', caution: true },
        { condition: 'job_level=5 AND monthly_income < 20000', caution: true }
      ],
      labelRules: [
        { indicators: ['job_satisfaction <= 2', 'overtime=true'], target: 'Left', weight: 0.75 },
        { indicators: ['years_since_promotion > 5', 'performance_rating <= 2'], target: 'Left', weight: 0.7 },
        { indicators: ['job_satisfaction >= 3', 'work_life_balance >= 3', 'years_at_company > 5'], target: 'Retained', weight: 0.85 }
      ]
    }
  },
  
  education: {
    student_performance: {
      columns: ['student_id', 'student_age', 'gender', 'family_size', 'parent_cohabitation', 'study_time_weekly', 'previous_semester_grade', 'attendance_rate', 'midterm_score', 'homework_completion', 'absences', 'extracurricular', 'part_time_job', 'mother_education', 'father_education', 'family_support', 'peer_influence', 'romantic_relationship', 'alcohol_weekend'],
      target: 'final_result',
      targetClasses: ['Pass', 'Fail'],
      idField: 'student_id',
      featureConstraints: {
        student_age: { min: 15, max: 22, type: 'integer' },
        study_time_weekly: { min: 0, max: 20, type: 'float', unit: 'hours' },
        previous_semester_grade: { min: 0, max: 20, type: 'float' },
        attendance_rate: { min: 0, max: 100, type: 'float', unit: 'percent' },
        midterm_score: { min: 0, max: 20, type: 'float' },
        absences: { min: 0, max: 50, type: 'integer' }
      },
      contradictions: [
        { condition: 'final_result=Pass AND attendance_rate < 60', invalid: true },
        { condition: 'alcohol_weekend=Very High AND attendance_rate > 85', invalid: true },
        { condition: 'midterm_score > 18 AND study_time_weekly < 2', requiresCompensation: true }
      ],
      labelRules: [
        { indicators: ['attendance_rate >= 75', 'midterm_score >= 10'], target: 'Pass', weight: 0.8 },
        { indicators: ['attendance_rate < 60'], target: 'Fail', weight: 0.85 },
        { indicators: ['midterm_score < 8'], target: 'Fail', weight: 0.8 },
        { indicators: ['absences > 20'], target: 'Fail', weight: 0.75 }
      ]
    }
  },
  
  ecommerce: {
    customer_churn: {
      columns: ['customer_id', 'tenure_months', 'internet_service', 'online_security', 'online_backup', 'tech_support', 'contract_type', 'payment_method', 'monthly_charges', 'total_charges', 'paperless_billing', 'number_of_referrals'],
      target: 'churn_label',
      targetClasses: ['Churned', 'Retained'],
      idField: 'customer_id',
      featureConstraints: {
        tenure_months: { min: 0, max: 72, type: 'integer' },
        monthly_charges: { min: 18, max: 119, type: 'float' },
        total_charges: { min: 0, max: 9500, type: 'float' },
        number_of_referrals: { min: 0, max: 10, type: 'integer' }
      },
      contradictions: [
        { condition: 'tenure_months > 60 AND churn_label=Churned', requiresCompensation: true },
        { condition: 'tech_support=No AND contract_type=Month-to-Month AND tenure_months < 12', valid: true }
      ],
      labelRules: [
        { indicators: ['contract_type=Month-to-Month', 'tenure_months < 12', 'tech_support=No'], target: 'Churned', weight: 0.85 },
        { indicators: ['internet_service=Fiber Optic', 'online_security=No', 'contract_type=Month-to-Month'], target: 'Churned', weight: 0.8 },
        { indicators: ['tenure_months >= 36', 'contract_type=Two Year'], target: 'Retained', weight: 0.92 },
        { indicators: ['tech_support=Yes', 'online_security=Yes', 'tenure_months > 24'], target: 'Retained', weight: 0.88 }
      ]
    }
  },
  
  nlp_classification: {
    fake_news_detection: {
      columns: ['article_id', 'headline', 'source_domain', 'author_known', 'publish_date_recency_days', 'has_quotes_from_experts', 'emotional_language_score', 'clickbait_score', 'factual_claim_count', 'verifiable_claim_ratio', 'political_leaning_score', 'cross_source_corroboration'],
      target: 'veracity',
      targetClasses: ['Real', 'Fake'],
      idField: 'article_id',
      featureConstraints: {
        publish_date_recency_days: { min: 0, max: 365, type: 'integer' },
        emotional_language_score: { min: 0, max: 1, type: 'float' },
        clickbait_score: { min: 0, max: 1, type: 'float' },
        factual_claim_count: { min: 0, max: 50, type: 'integer' },
        verifiable_claim_ratio: { min: 0, max: 1, type: 'float' },
        political_leaning_score: { min: -2, max: 2, type: 'float' }
      },
      contradictions: [
        { condition: 'veracity=Fake AND has_quotes_from_experts=true AND cross_source_corroboration=true', invalid: true },
        { condition: 'emotional_language_score < 0.2 AND clickbait_score < 0.2 AND veracity=Fake', invalid: true }
      ],
      labelRules: [
        { indicators: ['emotional_language_score > 0.7', 'clickbait_score > 0.7', 'verifiable_claim_ratio < 0.2', 'cross_source_corroboration=false'], target: 'Fake', weight: 0.85 },
        { indicators: ['has_quotes_from_experts=true', 'verifiable_claim_ratio > 0.6', 'cross_source_corroboration=true'], target: 'Real', weight: 0.9 }
      ]
    },
    
    intent_classification: {
      columns: ['utterance_id', 'raw_text', 'word_count', 'contains_question_mark', 'sentiment_score', 'entity_count', 'verb_type', 'domain_keywords_present', 'politeness_score', 'urgency_score'],
      target: 'intent_class',
      targetClasses: ['book_appointment', 'check_status', 'cancel_order', 'get_support', 'place_order', 'general_inquiry'],
      idField: 'utterance_id',
      featureConstraints: {
        word_count: { min: 1, max: 50, type: 'integer' },
        sentiment_score: { min: -1, max: 1, type: 'float' },
        entity_count: { min: 0, max: 10, type: 'integer' },
        politeness_score: { min: 0, max: 1, type: 'float' },
        urgency_score: { min: 0, max: 1, type: 'float' }
      },
      contradictions: [
        { condition: 'intent_class=book_appointment AND contains_question_mark=false', invalid: true },
        { condition: 'intent_class=cancel_order AND entity_count=0', invalid: true }
      ],
      labelRules: [
        { indicators: ['contains_question_mark=true', 'verb_type=schedule', 'urgency_score > 0.5'], target: 'book_appointment', weight: 0.85 },
        { indicators: ['verb_type=cancel', 'entity_count > 0'], target: 'cancel_order', weight: 0.8 },
        { indicators: ['urgency_score > 0.7', 'sentiment_score < 0'], target: 'get_support', weight: 0.75 },
        { indicators: ['verb_type=check', 'entity_count > 0'], target: 'check_status', weight: 0.85 }
      ]
    }
  },
  
  transport: {
    traffic_congestion: {
      columns: ['segment_id', 'road_type', 'time_of_day_hour', 'day_of_week', 'vehicle_count_per_minute', 'average_speed_kmh', 'weather_condition', 'incident_reported', 'construction_nearby', 'traffic_signal_density', 'public_transit_proximity'],
      target: 'congestion_level',
      targetClasses: ['Low', 'Medium', 'High', 'Severe'],
      idField: 'segment_id',
      featureConstraints: {
        time_of_day_hour: { min: 0, max: 23, type: 'integer' },
        day_of_week: { min: 0, max: 6, type: 'integer' },
        vehicle_count_per_minute: { min: 0, max: 100, type: 'integer' },
        average_speed_kmh: { min: 0, max: 120, type: 'integer' },
        traffic_signal_density: { min: 0, max: 20, type: 'integer' }
      },
      contradictions: [
        { condition: 'road_type=Urban AND average_speed_kmh > 80', invalid: true },
        { condition: 'congestion_level=Low AND vehicle_count_per_minute > 50', invalid: true },
        { condition: 'congestion_level=High AND average_speed_kmh > 60', invalid: true }
      ],
      labelRules: [
        { indicators: ['vehicle_count_per_minute > 60', 'average_speed_kmh < 20', 'time_of_day_hour IN [7,8,9,17,18,19]'], target: 'Severe', weight: 0.85 },
        { indicators: ['vehicle_count_per_minute > 40', 'average_speed_kmh < 30'], target: 'High', weight: 0.8 },
        { indicators: ['time_of_day_hour IN [2,3,4,5]', 'vehicle_count_per_minute < 10'], target: 'Low', weight: 0.9 },
        { indicators: ['vehicle_count_per_minute < 15', 'average_speed_kmh > 50'], target: 'Low', weight: 0.85 }
      ]
    }
  }
};

const DOMAIN_FAMILIES = {
  medical: ['heart_disease', 'diabetes', 'breast_cancer', 'kidney_disease'],
  financial: ['loan_default', 'credit_card_fraud'],
  hr: ['employee_attrition'],
  education: ['student_performance'],
  ecommerce: ['customer_churn'],
  nlp_classification: ['fake_news_detection', 'intent_classification'],
  transport: ['traffic_congestion']
};

function getDomainBlueprint(topic) {
  for (const [family, topics] of Object.entries(DOMAIN_FAMILIES)) {
    if (topics.includes(topic)) {
      return DOMAIN_BLUEPRINTS[family]?.[topic] || null;
    }
  }
  return DOMAIN_BLUEPRINTS.medical?.[topic] || null;
}

function getDomainFamily(topic) {
  for (const [family, topics] of Object.entries(DOMAIN_FAMILIES)) {
    if (topics.includes(topic)) {
      return family;
    }
  }
  return 'unknown';
}

function getAllBlueprintTopics() {
  const topics = [];
  for (const [family, familyTopics] of Object.entries(DOMAIN_FAMILIES)) {
    for (const topic of familyTopics) {
      topics.push({ topic, family, blueprint: DOMAIN_BLUEPRINTS[family]?.[topic] });
    }
  }
  return topics;
}

function hasBlueprint(topic) {
  return getDomainFamily(topic) !== 'unknown';
}

module.exports = {
  DOMAIN_BLUEPRINTS,
  DOMAIN_FAMILIES,
  getDomainBlueprint,
  getDomainFamily,
  getAllBlueprintTopics,
  hasBlueprint
};
