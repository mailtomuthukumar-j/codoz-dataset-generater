const DOMAIN_COLUMNS = {
  medical: {
    id: ['patient_id', 'case_id', 'record_id'],
    demographics: ['age', 'gender', 'race', 'bmi'],
    vitals: ['systolic_bp', 'diastolic_bp', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation'],
    lab_results: ['glucose', 'cholesterol', 'hdl', 'ldl', 'triglycerides', 'hemoglobin', 'wbc', 'platelets', 'creatinine'],
    clinical: ['waist_circumference', ' fasting_glucose', 'hba1c', 'insulin_level', 'tsh', 't4'],
    history: ['smoking_status', 'alcohol_use', 'exercise_frequency', 'family_history'],
    outcomes: ['diagnosis', 'disease_stage', 'treatment_outcome', 'mortality']
  },
  financial: {
    id: ['account_id', 'customer_id', 'transaction_id', 'loan_id'],
    demographics: ['age', 'gender', 'employment_years', 'income'],
    credit: ['credit_score', 'credit_utilization', 'payment_history', 'delinquency_count'],
    loan: ['loan_amount', 'loan_term', 'interest_rate', 'monthly_payment', 'debt_to_income'],
    account: ['account_balance', 'transaction_count', 'average_balance', 'min_balance'],
    behavioral: ['overdraft_count', 'late_payment_count', 'credit_inquiries'],
    outcomes: ['default_status', 'risk_rating', 'approval_status', 'fraud_flag']
  },
  education: {
    id: ['student_id', 'enrollment_id', 'course_id'],
    demographics: ['age', 'gender', 'parental_education', 'tuition_type'],
    academic: ['gpa', 'sat_score', 'act_score', 'class_rank'],
    performance: ['assignment_score', 'quiz_score', 'midterm_score', 'final_score', 'participation'],
    attendance: ['attendance_rate', 'absences', 'tardies', 'study_hours'],
    engagement: ['library_visits', 'office_hours_visits', 'online_activity'],
    outcomes: ['pass_fail', 'grade_letter', 'retention_status', 'graduation_probability']
  },
  retail: {
    id: ['customer_id', 'order_id', 'product_id', 'transaction_id'],
    demographics: ['age', 'gender', 'city_tier', 'membership_tier'],
    purchase: ['order_total', 'item_count', 'average_order_value', 'promotion_used'],
    product: ['category', 'subcategory', 'price', 'discount_percent', 'rating'],
    behavior: ['days_since_purchase', 'purchase_frequency', 'basket_size', 'cart_abandonment'],
    engagement: ['email_opens', 'click_through', 'returns_count'],
    outcomes: ['churn_risk', 'customer_lifetime_value', 'nps_score']
  },
  environmental: {
    id: ['station_id', 'sensor_id', 'measurement_id'],
    location: ['latitude', 'longitude', 'elevation', 'land_use_type'],
    meteorology: ['temperature', 'humidity', 'wind_speed', 'wind_direction', 'pressure', 'solar_radiation'],
    pollutants: ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co', 'nh3'],
    indices: ['aqi', 'air_quality_category', 'pollution_index'],
    temporal: ['timestamp', 'hour', 'day_of_week', 'season'],
    outcomes: ['health_advisory', 'pollution_level', 'compliance_status']
  },
  social: {
    id: ['user_id', 'post_id', 'engagement_id'],
    profile: ['followers', 'following', 'account_age_days', 'verified_status'],
    engagement: ['likes', 'comments', 'shares', 'views', 'saves'],
    content: ['post_count', 'avg_post_length', 'hashtag_count', 'media_count'],
    behavior: ['posting_frequency', 'engagement_rate', 'peak_activity_hour'],
    outcomes: ['influence_score', 'virality_score', 'sentiment_label']
  },
  hr: {
    id: ['employee_id', 'candidate_id', 'position_id'],
    demographics: ['age', 'gender', 'education_level', 'years_experience'],
    employment: ['department', 'job_level', 'tenure_years', 'promotion_count'],
    performance: ['performance_rating', 'goal_completion', 'peer_score', 'manager_score'],
    compensation: ['base_salary', 'bonus_percent', 'total_compensation'],
    engagement: ['satisfaction_score', 'nps_score', 'turnover_risk'],
    outcomes: ['attrition_flag', 'performance_tier', 'promotion_likelihood']
  },
  telecom: {
    id: ['customer_id', 'subscription_id', 'usage_id'],
    demographics: ['age', 'gender', 'location_type'],
    plan: ['plan_type', 'monthly_charge', 'data_limit_gb', 'voice_minutes_included'],
    usage: ['data_used_gb', 'voice_minutes_used', 'sms_count', 'overage_charges'],
    service: ['tech_support_tickets', 'complaints_count', 'service_outages'],
    engagement: ['app_usage_hours', 'online_payment', 'autopay_enrolled'],
    outcomes: ['churn_probability', 'upsell_potential', 'customer_value_tier']
  },
  ecommerce: {
    id: ['order_id', 'product_id', 'customer_id', 'review_id'],
    product: ['product_name', 'category', 'brand', 'price', 'discount'],
    order: ['quantity', 'shipping_cost', 'delivery_days', 'order_total'],
    customer: ['customer_age', 'account_age_days', 'total_orders', 'avg_review_rating'],
    review: ['review_rating', 'review_length', 'helpful_votes', 'verified_purchase'],
    outcomes: ['return_likelihood', 'repeat_purchase_probability', 'review_sentiment']
  },
  agriculture: {
    id: ['field_id', 'crop_id', 'observation_id'],
    field: ['latitude', 'longitude', 'area_hectares', 'soil_type', 'irrigation_type'],
    crop: ['crop_type', 'variety', 'planting_date', 'harvest_date', 'growth_stage'],
    soil: ['ph', 'organic_matter_percent', 'nitrogen', 'phosphorus', 'potassium', 'moisture'],
    weather: ['rainfall_mm', 'temperature_avg', 'humidity_avg', 'sunlight_hours'],
    outcomes: ['yield_kg_per_hectare', 'quality_grade', 'harvest_readiness']
  },
  technology: {
    id: ['user_id', 'request_id', 'incident_id', 'deployment_id'],
    system: ['service_name', 'region', 'instance_type', 'environment'],
    metrics: ['latency_ms', 'throughput_rps', 'error_rate_percent', 'cpu_percent', 'memory_percent'],
    code: ['commit_count', 'test_coverage_percent', 'build_duration_minutes', 'defect_count'],
    operations: ['deployment_frequency', 'change_failure_rate', 'mttr_hours'],
    outcomes: ['reliability_score', 'performance_tier', 'incident_severity']
  },
  sports: {
    id: ['player_id', 'team_id', 'match_id', 'game_id'],
    player: ['age', 'position', 'experience_years', 'height_cm', 'weight_kg'],
    performance: ['kills', 'deaths', 'assists', 'damage_dealt', 'objectives'],
    stats: ['win_rate', 'kda_ratio', 'headshot_percent', 'survival_time'],
    game: ['match_duration_minutes', 'map_name', 'game_mode', 'rank_tier'],
    outcomes: ['mvp_rating', 'performance_score', 'player_of_match']
  },
  engineering: {
    id: ['machine_id', 'sensor_id', 'maintenance_id'],
    machine: ['machine_type', 'model', 'age_years', 'operational_hours', 'utilization_percent'],
    sensor: ['temperature_celsius', 'vibration_mm_s', 'pressure_bar', 'power_kw', 'rpm'],
    maintenance: ['last_maintenance_days', 'maintenance_cost', 'downtime_hours'],
    quality: ['defect_count', 'reject_rate_percent', 'throughput_units_hr'],
    outcomes: ['failure_probability', 'maintenance_priority', 'remaining_useful_life']
  },
  transportation: {
    id: ['vehicle_id', 'route_id', 'trip_id', 'driver_id'],
    vehicle: ['vehicle_type', 'age_years', 'mileage_km', 'fuel_type', 'capacity'],
    trip: ['distance_km', 'duration_minutes', 'avg_speed_kmh', 'passenger_count'],
    driver: ['experience_years', 'accident_count', 'violation_count'],
    fuel: ['fuel_consumed_liters', 'fuel_efficiency_km_l', 'idle_time_percent'],
    outcomes: ['accident_risk', 'maintenance_score', 'driver_rating']
  },
  scientific: {
    id: ['experiment_id', 'sample_id', 'measurement_id'],
    subject: ['species', 'genotype', 'treatment_group', 'replicate_number'],
    experimental: ['concentration_mg_ml', 'temperature_celsius', 'ph', 'incubation_hours'],
    measurement: ['expression_level', 'optical_density', 'intensity_units', 'readout_value'],
    quality: ['purity_percent', 'viability_percent', 'quality_score'],
    outcomes: ['significant_result', 'effect_size', 'hypothesis_supported']
  }
};

const REALISTIC_RANGES = {
  age: [18, 90],
  bmi: [15, 50],
  systolic_bp: [80, 200],
  diastolic_bp: [50, 130],
  heart_rate: [40, 180],
  temperature: [35, 41],
  respiratory_rate: [8, 40],
  oxygen_saturation: [70, 100],
  glucose: [50, 400],
  cholesterol: [100, 400],
  hdl: [20, 100],
  ldl: [50, 250],
  triglycerides: [30, 500],
  hemoglobin: [8, 20],
  wbc: [3, 15],
  platelets: [100, 500],
  creatinine: [0.5, 15],
  credit_score: [300, 850],
  income: [15000, 500000],
  loan_amount: [1000, 1000000],
  interest_rate: [0.5, 30],
  debt_to_income: [0, 1],
  payment_history: [0, 100],
  gpa: [0, 4],
  sat_score: [400, 1600],
  attendance_rate: [0, 100],
  order_total: [5, 2000],
  price: [1, 5000],
  discount_percent: [0, 70],
  rating: [1, 5],
  pm25: [0, 500],
  pm10: [0, 500],
  no2: [0, 200],
  o3: [0, 200],
  so2: [0, 100],
  co: [0, 10],
  aqi: [0, 500],
  temperature: [-30, 50],
  humidity: [0, 100],
  wind_speed: [0, 150],
  pressure: [950, 1050],
  followers: [0, 50000000],
  following: [0, 10000],
  likes: [0, 10000000],
  comments: [0, 500000],
  views: [0, 100000000],
  salary: [25000, 500000],
  tenure_years: [0, 50],
  performance_rating: [1, 5],
  satisfaction_score: [0, 100],
  data_used_gb: [0, 500],
  voice_minutes_used: [0, 5000],
  latitude: [-90, 90],
  longitude: [-180, 180],
  yield_kg_per_hectare: [0, 20000],
  ph: [4, 9],
  nitrogen: [0, 200],
  phosphorus: [0, 200],
  potassium: [0, 300],
  moisture: [0, 100],
  latency_ms: [1, 5000],
  throughput_rps: [1, 10000],
  error_rate_percent: [0, 100],
  cpu_percent: [0, 100],
  memory_percent: [0, 100],
  kills: [0, 50],
  deaths: [0, 30],
  assists: [0, 50],
  win_rate: [0, 100],
  kda_ratio: [0, 20],
  temperature_celsius: [-50, 200],
  vibration_mm_s: [0, 50],
  pressure_bar: [0, 500],
  power_kw: [0, 1000],
  rpm: [0, 10000],
  distance_km: [0, 2000],
  duration_minutes: [1, 1440],
  speed_kmh: [0, 200],
  mileage_km: [0, 500000],
  fuel_efficiency_km_l: [3, 30],
  expression_level: [0, 100],
  concentration_mg_ml: [0, 100],
  optical_density: [0, 5],
  purity_percent: [0, 100],
  viability_percent: [0, 100]
};

function process(context) {
  const domain = context.domain || 'other';
  const subdomain = context.subdomain || context.topic;
  const task_type = context.task_type || 'classification';
  const target_column = context.target_column || generateTargetColumn(domain, task_type);
  const target_values = context.target_values || generateTargetValues(domain, task_type, target_column);
  
  const domainColumns = DOMAIN_COLUMNS[domain] || DOMAIN_COLUMNS.technology;
  const columns = [];
  
  const idColName = domainColumns.id?.[0] || `${domain.slice(0, 3)}_id`;
  columns.push({
    name: idColName,
    dtype: 'categorical',
    is_id: true,
    null_rate: 0
  });
  
  const demographics = domainColumns.demographics || [];
  const demoCount = Math.min(demographics.length, 3);
  for (let i = 0; i < demoCount; i++) {
    const colName = demographics[i];
    if (columns.find(c => c.name === colName)) continue;
    
    const range = getRangeForColumn(colName);
    columns.push({
      name: colName,
      dtype: getDtypeForColumn(colName),
      range: range,
      categories: getCategoriesForColumn(colName),
      null_rate: 0
    });
  }
  
  const domainSpecific = [
    ...(domainColumns.vitals || []),
    ...(domainColumns.lab_results || []),
    ...(domainColumns.clinical || []),
    ...(domainColumns.credit || []),
    ...(domainColumns.loan || []),
    ...(domainColumns.account || []),
    ...(domainColumns.academic || []),
    ...(domainColumns.performance || []),
    ...(domainColumns.purchase || []),
    ...(domainColumns.product || []),
    ...(domainColumns.meteorology || []),
    ...(domainColumns.pollutants || []),
    ...(domainColumns.engagement || []),
    ...(domainColumns.employment || []),
    ...(domainColumns.plan || []),
    ...(domainColumns.soil || []),
    ...(domainColumns.weather || []),
    ...(domainColumns.metrics || []),
    ...(domainColumns.performance || []),
    ...(domainColumns.sensor || []),
    ...(domainColumns.trip || []),
    ...(domainColumns.experimental || []),
    ...(domainColumns.measurement || [])
  ];
  
  const featureCount = Math.min(domainSpecific.length, 6);
  const shuffledFeatures = domainSpecific.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < featureCount; i++) {
    const colName = shuffledFeatures[i];
    if (columns.find(c => c.name === colName)) continue;
    
    const range = getRangeForColumn(colName);
    columns.push({
      name: colName,
      dtype: getDtypeForColumn(colName),
      range: range,
      categories: getCategoriesForColumn(colName),
      null_rate: 0
    });
  }
  
  if (context.geospatial && !columns.find(c => c.name === 'latitude' || c.name === 'longitude')) {
    columns.push({ name: 'latitude', dtype: 'float', range: [-90, 90], null_rate: 0 });
    columns.push({ name: 'longitude', dtype: 'float', range: [-180, 180], null_rate: 0 });
  }
  
  if (context.temporal && !columns.find(c => c.name.includes('date') || c.name.includes('timestamp'))) {
    columns.push({ name: 'timestamp', dtype: 'datetime', null_rate: 0 });
  }
  
  const outcomes = domainColumns.outcomes || ['outcome', 'result', 'status'];
  const outcomeColName = outcomes[Math.floor(Math.random() * outcomes.length)];
  
  columns.push({
    name: outcomeColName,
    dtype: task_type === 'regression' ? 'float' : 'categorical',
    range: task_type === 'regression' ? target_values : undefined,
    categories: task_type === 'regression' ? undefined : target_values,
    is_target: true,
    null_rate: 0
  });
  
  const label_distribution = generateLabelDistribution(task_type, target_values);
  
  const schema = {
    columns,
    constraints: [],
    label_distribution,
    schema_source: 'llm_knowledge'
  };
  
  return {
    ...context,
    schema,
    target_column: outcomeColName,
    label_distribution,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'schema_architect_complete',
      data: { column_count: columns.length, source: 'llm_knowledge', domain }
    }]
  };
}

function generateTargetColumn(domain, task_type) {
  const targets = {
    medical: ['diagnosis', 'disease_risk', 'treatment_outcome'],
    financial: ['default_risk', 'credit_approval', 'fraud_detection'],
    education: ['pass_fail', 'grade_prediction', 'retention_risk'],
    retail: ['churn_risk', 'customer_value', 'purchase_likelihood'],
    environmental: ['pollution_level', 'health_advisory', 'compliance_status'],
    social: ['engagement_level', 'influence_score', 'sentiment'],
    hr: ['attrition_risk', 'performance_tier', 'promotion_likelihood'],
    telecom: ['churn_probability', 'upsell_potential', 'value_tier'],
    ecommerce: ['return_likelihood', 'repeat_purchase', 'review_sentiment'],
    agriculture: ['yield_prediction', 'quality_grade', 'harvest_status'],
    technology: ['reliability_score', 'performance_tier', 'incident_severity'],
    sports: ['performance_rating', 'win_probability', 'mvp_candidate'],
    engineering: ['failure_probability', 'maintenance_priority', 'remaining_life'],
    transportation: ['accident_risk', 'maintenance_score', 'driver_rating'],
    scientific: ['significant_result', 'effect_size', 'hypothesis_status']
  };
  
  const domainTargets = targets[domain] || targets.technology;
  return domainTargets[Math.floor(Math.random() * domainTargets.length)];
}

function generateTargetValues(domain, task_type, target_column) {
  if (task_type === 'regression') {
    if (target_column.includes('score') || target_column.includes('rating')) {
      return [0, 100];
    }
    if (target_column.includes('probability') || target_column.includes('risk')) {
      return [0, 1];
    }
    return [0, 100];
  }
  
  if (target_column.includes('risk') || target_column.includes('level')) {
    return ['Low', 'Medium', 'High'];
  }
  if (target_column.includes('tier') || target_column.includes('grade')) {
    return ['A', 'B', 'C', 'D'];
  }
  if (target_column.includes('status') || target_column.includes('out')) {
    return ['No', 'Yes'];
  }
  if (target_column.includes('sentiment') || target_column.includes('result')) {
    return ['Positive', 'Neutral', 'Negative'];
  }
  
  return ['No', 'Yes'];
}

function getRangeForColumn(columnName) {
  const name = columnName.toLowerCase();
  
  for (const [key, range] of Object.entries(REALISTIC_RANGES)) {
    if (name.includes(key)) {
      return range;
    }
  }
  
  const patterns = [
    { suffix: '_rate', range: [0, 100] },
    { suffix: '_percent', range: [0, 100] },
    { suffix: '_count', range: [0, 1000] },
    { suffix: '_years', range: [0, 50] },
    { suffix: '_days', range: [0, 365] },
    { suffix: '_hours', range: [0, 24] },
    { suffix: '_score', range: [0, 100] },
    { suffix: '_index', range: [0, 100] }
  ];
  
  for (const { suffix, range } of patterns) {
    if (name.endsWith(suffix)) {
      return range;
    }
  }
  
  return [0, 100];
}

function getDtypeForColumn(columnName) {
  const name = columnName.toLowerCase();
  
  if (name.includes('_id') || name.includes('name') || name.includes('type') || 
      name.includes('status') || name.includes('gender') || name.includes('category') ||
      name.includes('race') || name.includes('ethnicity')) {
    return 'categorical';
  }
  
  if (name.includes('date') || name.includes('timestamp')) {
    return 'datetime';
  }
  
  if (name.includes('is_') || name.includes('has_') || name.includes('flag')) {
    return 'boolean';
  }
  
  if (name.includes('_rate') || name.includes('_percent') || name.includes('ratio') || 
      name.includes('_score') || name.includes('_index')) {
    return 'float';
  }
  
  if (name.includes('_count') || name.includes('_age') || name.includes('_years') || 
      name.includes('_days') || name.includes('quantity')) {
    return 'int';
  }
  
  return 'float';
}

function getCategoriesForColumn(columnName) {
  const name = columnName.toLowerCase();
  
  if (name.includes('gender')) return ['Male', 'Female'];
  if (name.includes('race') || name.includes('ethnicity')) return ['White', 'Black', 'Asian', 'Hispanic', 'Other'];
  if (name.includes('city') || name.includes('tier')) return ['Tier 1', 'Tier 2', 'Tier 3'];
  if (name.includes('status')) return ['Active', 'Inactive', 'Pending'];
  if (name.includes('type')) return ['Type A', 'Type B', 'Type C'];
  if (name.includes('tier')) return ['Bronze', 'Silver', 'Gold', 'Platinum'];
  if (name.includes('level')) return ['Low', 'Medium', 'High'];
  if (name.includes('priority')) return ['Low', 'Normal', 'High', 'Urgent'];
  if (name.includes('verified')) return [true, false];
  if (name.includes('smoking')) return ['Never', 'Former', 'Current'];
  if (name.includes('payment')) return ['On Time', 'Late', 'Missed'];
  
  return null;
}

function generateLabelDistribution(task_type, target_values) {
  if (task_type === 'regression') {
    return { range: target_values };
  }
  
  if (Array.isArray(target_values)) {
    if (target_values.length === 2) {
      if (typeof target_values[0] === 'string') {
        return { [target_values[0]]: 0.65, [target_values[1]]: 0.35 };
      }
      return { [target_values[0]]: 0.65, [target_values[1]]: 0.35 };
    }
    const equal = 1 / target_values.length;
    const dist = {};
    for (const v of target_values) {
      dist[v] = equal;
    }
    return dist;
  }
  
  return { 'No': 0.65, 'Yes': 0.35 };
}

module.exports = { process };
