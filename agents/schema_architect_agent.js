const STRICT_RANGES = {
  blood_pressure_systolic: [60, 180],
  blood_pressure_diastolic: [40, 120],
  heart_rate: [40, 140],
  body_temperature: [35.0, 41.5],
  bmi: [15.0, 55.0],
  glucose_fasting: [50.0, 500.0],
  glucose: [50.0, 500.0],
  hba1c: [4.0, 16.0],
  insulin_level: [2.0, 300.0],
  age: [18, 100],
  age_years: [18, 80],
  pregnancies: [0, 20],
  skin_thickness: [10.0, 99.0],
  cholesterol: [100.0, 400.0],
  hdl: [20.0, 100.0],
  ldl: [50.0, 250.0],
  credit_score: [300, 850],
  income: [0.0, 500000.0],
  loan_amount: [1000.0, 1000000.0],
  debt_ratio: [0.0, 1.0],
  payment_history: [0.0, 100.0],
  temperature: [-50.0, 60.0],
  humidity: [0.0, 100.0],
  wind_speed: [0.0, 150.0],
  aqi: [0, 500],
  pm25: [0.0, 500.0],
  pm10: [0.0, 500.0],
  no2: [0.0, 200.0],
  o3: [0.0, 200.0],
  co: [0.0, 10.0],
  gpa: [0.0, 4.0],
  sat_score: [400, 1600],
  attendance_rate: [0, 100],
  score: [0, 100],
  rating: [1, 5],
  order_total: [5.0, 5000.0],
  price: [0.0, 10000.0],
  discount_percent: [0, 70],
  quantity: [1, 100],
  followers: [0, 50000000],
  following: [0, 10000],
  likes: [0, 10000000],
  salary: [25000.0, 500000.0],
  tenure_years: [0, 40],
  performance_score: [1, 5],
  data_used_gb: [0, 500],
  latency_ms: [1, 5000],
  error_rate: [0.0, 100.0],
  cpu_usage: [0, 100],
  memory_usage: [0, 100],
  kills: [0, 50],
  deaths: [0, 30],
  assists: [0, 50],
  win_rate: [0.0, 100.0],
  kills_deaths_ratio: [0.0, 20.0],
  latitude: [-90.0, 90.0],
  longitude: [-180.0, 180.0]
};

const DOMAIN_CONSTRAINTS = {
  medical: [
    { condition: 'target = diabetic', consequence: 'glucose > 126 OR hba1c > 6.5', strength: 0.95 },
    { condition: 'target = healthy', consequence: 'glucose < 100 AND bmi < 30', strength: 0.85 },
    { condition: 'target = pre_diabetic', consequence: 'glucose >= 100 AND glucose <= 125', strength: 0.90 },
    { condition: 'gender != female', consequence: 'pregnancies = 0', strength: 1.0 },
    { condition: 'bmi > 35', consequence: 'activity_level IN [sedentary, light]', strength: 0.80 },
    { condition: 'glucose > 180', consequence: 'hba1c > 7.5', strength: 0.92 },
    { condition: 'glucose < 100', consequence: 'hba1c < 5.7', strength: 0.88 }
  ],
  financial: [
    { condition: 'target = default', consequence: 'credit_score < 650 OR debt_ratio > 0.4', strength: 0.90 },
    { condition: 'target = approved', consequence: 'credit_score >= 650 AND debt_ratio < 0.4', strength: 0.85 },
    { condition: 'income < 30000', consequence: 'loan_amount < 200000', strength: 0.75 }
  ],
  retail: [
    { condition: 'target = churn', consequence: 'order_frequency < 3 OR rating < 3', strength: 0.85 },
    { condition: 'target = retained', consequence: 'order_frequency >= 3 OR rating >= 3', strength: 0.80 }
  ],
  environmental: [
    { condition: 'temperature > 35 AND humidity < 20', consequence: 'fire_risk IN [high, extreme]', strength: 0.90 },
    { condition: 'pm25 > 150', consequence: 'aqi > 150', strength: 0.95 }
  ],
  education: [
    { condition: 'target = fail', consequence: 'study_hours < 5 OR attendance_rate < 60', strength: 0.85 },
    { condition: 'target = pass', consequence: 'study_hours >= 10 AND attendance_rate >= 75', strength: 0.80 }
  ],
  sports: [
    { condition: 'kills > 20', consequence: 'kills_deaths_ratio > 2.0', strength: 0.90 },
    { condition: 'deaths > 15', consequence: 'win_rate < 40', strength: 0.85 }
  ],
  default: []
};

function process(context) {
  const topic = context.topic || '';
  const domain = context.domain || 'other';
  const task_type = context.task_type || 'classification';
  const target_values = context.target_values || ['No', 'Yes'];
  const temporal = context.temporal || false;
  const geospatial = context.geospatial || false;
  
  const columns = [];
  const constraints = DOMAIN_CONSTRAINTS[domain] || DOMAIN_CONSTRAINTS.default;
  
  columns.push({
    name: 'id',
    dtype: 'uuid',
    null_rate: 0
  });
  
  const targetColName = context.target_column || inferTargetColumn(domain, task_type);
  columns.push({
    name: targetColName,
    dtype: task_type === 'regression' ? 'float' : 'categorical',
    range: task_type === 'regression' ? target_values : undefined,
    categories: task_type === 'regression' ? undefined : target_values,
    is_target: true,
    generation_order: 1,
    null_rate: 0
  });
  
  const demographics = generateDemographics(domain);
  for (const col of demographics) {
    col.generation_order = 6;
    columns.push(col);
  }
  
  const measurements = generateMeasurements(domain, targetColName);
  for (const col of measurements) {
    col.generation_order = 3;
    columns.push(col);
  }
  
  if (temporal) {
    columns.push({
      name: 'timestamp',
      dtype: 'datetime',
      null_rate: 0,
      generation_order: 7
    });
  }
  
  if (geospatial) {
    columns.push({
      name: 'latitude',
      dtype: 'float',
      range: [-90.0, 90.0],
      null_rate: 0,
      generation_order: 7
    });
    columns.push({
      name: 'longitude',
      dtype: 'float',
      range: [-180.0, 180.0],
      null_rate: 0,
      generation_order: 7
    });
  }
  
  columns.sort((a, b) => (a.generation_order || 5) - (b.generation_order || 5));
  
  const label_distribution = generateLabelDistribution(task_type, target_values);
  
  const schema = {
    columns,
    constraints,
    label_distribution,
    schema_source: 'strict_dynamic_generation'
  };
  
  return {
    ...context,
    schema,
    target_column: targetColName,
    label_distribution,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'schema_architect_complete',
      data: { column_count: columns.length, source: 'strict_dynamic_generation', domain }
    }]
  };
}

function inferTargetColumn(domain, task_type) {
  const targets = {
    medical: 'diagnosis',
    financial: 'approval_status',
    education: 'pass_status',
    retail: 'churn',
    environmental: 'risk_level',
    social: 'engagement_level',
    hr: 'attrition_status',
    telecom: 'churn',
    ecommerce: 'purchase_status',
    agriculture: 'yield_status',
    technology: 'status',
    sports: 'outcome',
    engineering: 'status',
    transportation: 'status',
    scientific: 'result'
  };
  return targets[domain] || 'target';
}

function generateDemographics(domain) {
  const cols = [];
  
  cols.push({
    name: 'age',
    dtype: 'int',
    range: [18, 100],
    null_rate: 0
  });
  
  if (domain !== 'environmental') {
    cols.push({
      name: 'gender',
      dtype: 'categorical',
      categories: ['male', 'female', 'other'],
      null_rate: 0
    });
  }
  
  return cols;
}

function generateMeasurements(domain, targetColName) {
  const cols = [];
  
  const domainSpecific = {
    medical: [
      { name: 'glucose', dtype: 'float', range: [50.0, 500.0] },
      { name: 'hba1c', dtype: 'float', range: [4.0, 16.0] },
      { name: 'bmi', dtype: 'float', range: [15.0, 55.0] },
      { name: 'blood_pressure_systolic', dtype: 'int', range: [60, 180] },
      { name: 'blood_pressure_diastolic', dtype: 'int', range: [40, 120] },
      { name: 'cholesterol', dtype: 'float', range: [100.0, 400.0] },
      { name: 'heart_rate', dtype: 'int', range: [40, 140] }
    ],
    financial: [
      { name: 'credit_score', dtype: 'int', range: [300, 850] },
      { name: 'income', dtype: 'float', range: [0.0, 500000.0] },
      { name: 'loan_amount', dtype: 'float', range: [1000.0, 1000000.0] },
      { name: 'debt_ratio', dtype: 'float', range: [0.0, 1.0] },
      { name: 'payment_history', dtype: 'float', range: [0.0, 100.0] }
    ],
    retail: [
      { name: 'order_total', dtype: 'float', range: [5.0, 5000.0] },
      { name: 'quantity', dtype: 'int', range: [1, 100] },
      { name: 'rating', dtype: 'float', range: [1.0, 5.0] },
      { name: 'discount_percent', dtype: 'int', range: [0, 70] }
    ],
    environmental: [
      { name: 'temperature', dtype: 'float', range: [-50.0, 60.0] },
      { name: 'humidity', dtype: 'float', range: [0.0, 100.0] },
      { name: 'wind_speed', dtype: 'float', range: [0.0, 150.0] },
      { name: 'pm25', dtype: 'float', range: [0.0, 500.0] },
      { name: 'aqi', dtype: 'int', range: [0, 500] }
    ],
    education: [
      { name: 'gpa', dtype: 'float', range: [0.0, 4.0] },
      { name: 'study_hours', dtype: 'float', range: [0.0, 40.0] },
      { name: 'attendance_rate', dtype: 'int', range: [0, 100] },
      { name: 'score', dtype: 'int', range: [0, 100] }
    ],
    social: [
      { name: 'followers', dtype: 'int', range: [0, 50000000] },
      { name: 'following', dtype: 'int', range: [0, 10000] },
      { name: 'likes', dtype: 'int', range: [0, 10000000] },
      { name: 'engagement_rate', dtype: 'float', range: [0.0, 15.0] }
    ],
    hr: [
      { name: 'salary', dtype: 'float', range: [25000.0, 500000.0] },
      { name: 'tenure_years', dtype: 'float', range: [0.0, 40.0] },
      { name: 'performance_score', dtype: 'int', range: [1, 5] }
    ],
    technology: [
      { name: 'latency_ms', dtype: 'int', range: [1, 5000] },
      { name: 'error_rate', dtype: 'float', range: [0.0, 100.0] },
      { name: 'cpu_usage', dtype: 'int', range: [0, 100] },
      { name: 'memory_usage', dtype: 'int', range: [0, 100] }
    ],
    sports: [
      { name: 'kills', dtype: 'int', range: [0, 50] },
      { name: 'deaths', dtype: 'int', range: [0, 30] },
      { name: 'assists', dtype: 'int', range: [0, 50] },
      { name: 'win_rate', dtype: 'float', range: [0.0, 100.0] },
      { name: 'kills_deaths_ratio', dtype: 'float', range: [0.0, 20.0] }
    ],
    default: [
      { name: 'value', dtype: 'float', range: [0.0, 100.0] },
      { name: 'count', dtype: 'int', range: [0, 1000] },
      { name: 'score', dtype: 'int', range: [0, 100] }
    ]
  };
  
  const candidates = domainSpecific[domain] || domainSpecific.default;
  
  for (const col of candidates.slice(0, 5)) {
    cols.push({ ...col, null_rate: 0 });
  }
  
  return cols;
}

function generateLabelDistribution(task_type, target_values) {
  if (task_type === 'regression') {
    return { range: target_values };
  }
  
  if (Array.isArray(target_values)) {
    if (target_values.length === 2) {
      return { [target_values[0]]: 0.65, [target_values[1]]: 0.35 };
    }
    if (target_values.length === 3) {
      return { [target_values[0]]: 0.50, [target_values[1]]: 0.30, [target_values[2]]: 0.20 };
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
