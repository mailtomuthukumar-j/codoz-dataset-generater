const DOMAIN_COLUMNS = {
  medical: {
    id: ['patient_id', 'record_id', 'case_id'],
    demographics: ['age', 'gender', 'race', 'ethnicity', 'bmi', 'blood_type'],
    clinical: ['glucose', 'blood_pressure', 'cholesterol', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation'],
    diagnostic: ['test_result', 'diagnosis', 'stage', 'grade', 'severity'],
    treatment: ['treatment_type', 'medication', 'dosage', 'duration', 'outcome'],
    temporal: ['admission_date', 'discharge_date', 'visit_date', 'test_date']
  },
  financial: {
    id: ['transaction_id', 'account_id', 'customer_id', 'loan_id'],
    demographics: ['age', 'gender', 'income', 'employment_status', 'education_level'],
    financial: ['credit_score', 'balance', 'loan_amount', 'interest_rate', 'debt_to_income', 'payment_amount'],
    transaction: ['transaction_amount', 'transaction_type', 'merchant_category', 'location'],
    temporal: ['transaction_date', 'payment_date', 'account_open_date']
  },
  education: {
    id: ['student_id', 'course_id', 'enrollment_id'],
    demographics: ['age', 'gender', 'race', 'parental_education'],
    academic: ['gpa', 'grade', 'score', 'attendance', 'credits_completed'],
    course: ['course_name', 'department', 'instructor', 'semester'],
    temporal: ['enrollment_date', 'completion_date', 'exam_date']
  },
  retail: {
    id: ['customer_id', 'order_id', 'product_id', 'transaction_id'],
    demographics: ['age', 'gender', 'location', 'membership_level'],
    product: ['category', 'subcategory', 'brand', 'price', 'quantity'],
    transaction: ['order_total', 'discount', 'shipping_cost', 'payment_method'],
    temporal: ['order_date', 'ship_date', 'delivery_date']
  },
  environmental: {
    id: ['station_id', 'sensor_id', 'measurement_id'],
    location: ['latitude', 'longitude', 'region', 'elevation', 'land_use'],
    measurements: ['temperature', 'humidity', 'pressure', 'wind_speed', 'wind_direction', 'precipitation'],
    pollutants: ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co', 'aqi'],
    temporal: ['timestamp', 'date', 'hour']
  },
  social: {
    id: ['user_id', 'post_id', 'engagement_id'],
    user: ['username', 'followers', 'following', 'verified', 'account_age'],
    engagement: ['likes', 'comments', 'shares', 'views', 'engagement_rate'],
    content: ['post_type', 'hashtags', 'mentions', 'sentiment'],
    temporal: ['post_date', 'publish_time']
  },
  hr: {
    id: ['employee_id', 'candidate_id', 'position_id'],
    demographics: ['age', 'gender', 'education_level', 'marital_status'],
    employment: ['department', 'job_title', 'job_level', 'employment_type', 'tenure'],
    performance: ['performance_score', 'rating', 'promotions', 'training_hours'],
    compensation: ['salary', 'bonus', 'benefits'],
    temporal: ['hire_date', 'termination_date', 'review_date']
  },
  telecom: {
    id: ['customer_id', 'subscription_id', 'usage_id'],
    demographics: ['age', 'gender', 'location', 'contract_type'],
    plan: ['plan_type', 'monthly_charge', 'data_limit', 'voice_minutes', 'sms_limit'],
    usage: ['data_used', 'voice_minutes_used', 'sms_used', 'overage_charges'],
    temporal: ['subscription_start', 'billing_date', 'usage_date']
  },
  ecommerce: {
    id: ['order_id', 'product_id', 'customer_id', 'review_id'],
    product: ['product_name', 'category', 'brand', 'price', 'rating', 'review_count'],
    order: ['quantity', 'discount', 'shipping_method', 'delivery_time'],
    customer: ['customer_age', 'customer_segment', 'previous_purchases'],
    temporal: ['order_date', 'delivery_date', 'review_date']
  },
  agriculture: {
    id: ['field_id', 'crop_id', 'observation_id'],
    field: ['latitude', 'longitude', 'elevation', 'soil_type', 'area'],
    crop: ['crop_type', 'variety', 'planting_date', 'harvest_date'],
    measurements: ['yield', 'rainfall', 'temperature', 'humidity', 'soil_moisture', 'ph', 'nitrogen', 'phosphorus', 'potassium'],
    temporal: ['observation_date', 'planting_date', 'harvest_date']
  },
  technology: {
    id: ['user_id', 'request_id', 'deployment_id', 'incident_id'],
    system: ['service_name', 'environment', 'region', 'instance_type'],
    metrics: ['latency', 'throughput', 'error_rate', 'cpu_usage', 'memory_usage', 'request_count'],
    code: ['repository', 'commit_count', 'test_coverage', 'build_duration'],
    temporal: ['timestamp', 'deployment_date', 'incident_start']
  },
  sports: {
    id: ['player_id', 'team_id', 'match_id'],
    player: ['age', 'position', 'experience', 'height', 'weight'],
    performance: ['kills', 'deaths', 'assists', 'score', 'rating', 'win_rate'],
    game: ['game_mode', 'map', 'duration', 'result'],
    temporal: ['match_date', 'season', 'week']
  },
  engineering: {
    id: ['machine_id', 'sensor_id', 'maintenance_id'],
    machine: ['machine_type', 'model', 'age', 'operational_hours'],
    sensor: ['temperature', 'vibration', 'pressure', 'power_consumption', 'speed'],
    maintenance: ['maintenance_type', 'downtime', 'failure_mode'],
    temporal: ['timestamp', 'maintenance_date', 'failure_date']
  },
  transportation: {
    id: ['vehicle_id', 'route_id', 'trip_id', 'driver_id'],
    vehicle: ['vehicle_type', 'model', 'age', 'mileage', 'fuel_type'],
    trip: ['distance', 'duration', 'speed', 'passenger_count', 'fuel_consumed'],
    temporal: ['departure_time', 'arrival_time', 'trip_date']
  },
  scientific: {
    id: ['experiment_id', 'sample_id', 'observation_id'],
    subject: ['subject_id', 'species', 'genotype', 'treatment_group'],
    measurements: ['measurement_value', 'concentration', 'intensity', 'expression_level'],
    experimental: ['replicate', 'control', 'condition', 'protocol'],
    temporal: ['experiment_date', 'measurement_time']
  }
};

function process(context) {
  const schema_refs = context.schema_refs || [];
  const domain = context.domain;
  const subdomain = context.subdomain;
  const task_type = context.task_type;
  const target_column = context.target_column;
  const target_values = context.target_values || [0, 1];
  const key_entities = context.key_entities || [];
  const temporal = context.temporal;
  const geospatial = context.geospatial;
  
  let columns = [];
  let constraints = [];
  let label_distribution = {};
  let schema_source = 'llm_knowledge';
  
  if (schema_refs.length > 0) {
    const synthesis = synthesizeFromRefs(schema_refs, target_column);
    columns = synthesis.columns;
    constraints = synthesis.constraints;
    label_distribution = synthesis.label_distribution;
    schema_source = synthesis.refs_count > 1 ? 'synthesized_from_refs' : 'hybrid';
  }
  
  if (columns.length < 5) {
    const domainColumns = generateFromDomainKnowledge(domain, subdomain, task_type, target_column, key_entities, temporal, geospatial);
    columns = mergeColumns(columns, domainColumns);
    schema_source = schema_refs.length > 0 ? 'hybrid' : 'llm_knowledge';
  }
  
  if (!columns.find(c => c.is_target)) {
    const targetCol = columns.find(c => c.name === target_column);
    if (targetCol) {
      targetCol.is_target = true;
    } else {
      columns.push({
        name: target_column,
        dtype: task_type === 'regression' ? 'float' : 'categorical',
        is_target: true,
        null_rate: 0,
        ...(task_type === 'regression' ? { range: target_values } : { categories: target_values })
      });
    }
  }
  
  if (columns.filter(c => c.is_target).length > 1) {
    const nonTarget = columns.find(c => c.is_target && c.name !== target_column);
    if (nonTarget) nonTarget.is_target = false;
  }
  
  const columnCount = columns.length;
  if (columnCount < 8) {
    const additional = generateAdditionalColumns(domain, task_type, columns);
    columns = [...columns, ...additional];
  }
  
  if (Object.keys(label_distribution).length === 0) {
    label_distribution = generateLabelDistribution(task_type, target_values);
  }
  
  const schema = {
    columns,
    constraints,
    label_distribution,
    schema_source
  };
  
  return {
    ...context,
    schema,
    label_distribution,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'schema_architect_complete',
      data: { column_count: columns.length, source: schema_source }
    }]
  };
}

function synthesizeFromRefs(refs, targetColumn) {
  const columnFrequency = {};
  const allConstraints = [];
  const allDistributions = [];
  
  for (const ref of refs) {
    for (const col of ref.columns || []) {
      if (!columnFrequency[col.name]) {
        columnFrequency[col.name] = { count: 0, data: col };
      }
      columnFrequency[col.name].count++;
    }
    
    if (ref.notable_correlations) {
      allConstraints.push(...ref.notable_correlations);
    }
    
    if (ref.label_distribution) {
      allDistributions.push(ref.label_distribution);
    }
  }
  
  const columns = [];
  
  for (const [name, { count, data }] of Object.entries(columnFrequency)) {
    if (count >= 1) {
      columns.push({
        name,
        dtype: data.dtype || inferDtype(name),
        range: data.range,
        categories: data.categories,
        sample_values: data.sample_values,
        is_target: name === targetColumn,
        null_rate: 0
      });
    }
  }
  
  const constraints = allConstraints.slice(0, 5).map(c => ({
    type: 'correlation',
    condition: c,
    consequence: '',
    strength: 0.7
  }));
  
  const label_distribution = allDistributions[0] || {};
  
  return {
    columns,
    constraints,
    label_distribution,
    refs_count: refs.length
  };
}

function generateFromDomainKnowledge(domain, subdomain, task_type, target_column, key_entities, temporal, geospatial) {
  const domainColumns = DOMAIN_COLUMNS[domain] || DOMAIN_COLUMNS.technology;
  const columns = [];
  
  if (domainColumns.id) {
    const idCol = domainColumns.id[0];
    columns.push({
      name: idCol,
      dtype: 'categorical',
      is_id: true,
      null_rate: 0
    });
  }
  
  const demographics = domainColumns.demographics || [];
  for (const dem of demographics.slice(0, 2)) {
    columns.push({
      name: dem,
      dtype: dem === 'age' ? 'int' : 'categorical',
      range: dem === 'age' ? [18, 80] : undefined,
      categories: getCategoricalOptions(dem),
      null_rate: 0
    });
  }
  
  const measurements = domainColumns.measurements || domainColumns.clinical || domainColumns.financial || [];
  for (const meas of measurements.slice(0, 4)) {
    if (key_entities.includes(meas) || columns.find(c => c.name === meas)) continue;
    columns.push({
      name: meas,
      dtype: 'float',
      range: getMeasurementRange(meas),
      null_rate: 0
    });
  }
  
  if (geospatial && !columns.find(c => c.name.includes('lat') || c.name.includes('lon'))) {
    columns.push({ name: 'latitude', dtype: 'float', range: [-90, 90], null_rate: 0 });
    columns.push({ name: 'longitude', dtype: 'float', range: [-180, 180], null_rate: 0 });
  }
  
  if (temporal && !columns.find(c => c.dtype === 'datetime')) {
    columns.push({ name: 'timestamp', dtype: 'datetime', null_rate: 0 });
  }
  
  return columns;
}

function mergeColumns(existing, newColumns) {
  const names = new Set(existing.map(c => c.name));
  
  for (const col of newColumns) {
    if (!names.has(col.name)) {
      existing.push(col);
      names.add(col.name);
    }
  }
  
  return existing;
}

function generateAdditionalColumns(domain, task_type, existingColumns) {
  const additional = [];
  const existingNames = new Set(existingColumns.map(c => c.name));
  
  const genericColumns = [
    { name: 'index', dtype: 'int', range: [1, 10000] },
    { name: 'value', dtype: 'float', range: [0, 100] },
    { name: 'status', dtype: 'categorical', categories: ['Active', 'Inactive', 'Pending'] },
    { name: 'priority', dtype: 'ordinal', categories: ['Low', 'Medium', 'High'] },
    { name: 'score', dtype: 'float', range: [0, 100] },
    { name: 'count', dtype: 'int', range: [0, 1000] },
    { name: 'rate', dtype: 'float', range: [0, 1] }
  ];
  
  for (const col of genericColumns) {
    if (!existingNames.has(col.name) && additional.length < 3) {
      additional.push({ ...col, null_rate: 0 });
    }
  }
  
  return additional;
}

function generateLabelDistribution(task_type, target_values) {
  if (task_type === 'regression') {
    return { range: target_values };
  }
  
  if (Array.isArray(target_values)) {
    if (target_values.length === 2) {
      return { [target_values[0]]: 0.65, [target_values[1]]: 0.35 };
    }
    const equal = 1 / target_values.length;
    const dist = {};
    for (const v of target_values) {
      dist[v] = equal;
    }
    return dist;
  }
  
  return { '0': 0.65, '1': 0.35 };
}

function inferDtype(columnName) {
  const name = columnName.toLowerCase();
  if (name.includes('id')) return 'categorical';
  if (name.includes('date') || name.includes('time')) return 'datetime';
  if (name.includes('is_') || name.includes('has_')) return 'boolean';
  if (name.includes('age') || name.includes('count') || name.includes('year')) return 'int';
  return 'float';
}

function getCategoricalOptions(column) {
  const options = {
    gender: ['Male', 'Female'],
    education_level: ['High School', 'Bachelor', 'Master', 'PhD'],
    marital_status: ['Single', 'Married', 'Divorced', 'Widowed'],
    employment_status: ['Employed', 'Self-employed', 'Unemployed'],
    status: ['Active', 'Inactive', 'Pending'],
    level: ['Low', 'Medium', 'High'],
    priority: ['Low', 'Normal', 'High', 'Urgent']
  };
  
  for (const [key, vals] of Object.entries(options)) {
    if (column.includes(key)) return vals;
  }
  
  return ['Category A', 'Category B', 'Category C'];
}

function getMeasurementRange(measurement) {
  const ranges = {
    temperature: [-20, 50],
    humidity: [0, 100],
    pressure: [900, 1100],
    wind_speed: [0, 100],
    glucose: [50, 300],
    blood_pressure: [60, 200],
    cholesterol: [100, 400],
    heart_rate: [40, 200],
    bmi: [10, 60],
    income: [10000, 500000],
    price: [0, 10000],
    score: [0, 100],
    rating: [1, 5],
    rate: [0, 1],
    percentage: [0, 100],
    pm25: [0, 500],
    pm10: [0, 500],
    aqi: [0, 500]
  };
  
  for (const [key, range] of Object.entries(ranges)) {
    if (measurement.includes(key)) return range;
  }
  
  return [0, 100];
}

module.exports = { process };
