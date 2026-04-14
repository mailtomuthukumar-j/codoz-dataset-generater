function process(context) {
  const topic = context.topic || '';
  const domain = context.domain || 'technology';
  const subdomain = context.subdomain || '';
  const task_type = context.task_type || 'classification';
  const target_column = context.target_column || 'outcome';
  const target_values = context.target_values || ['No', 'Yes'];
  const temporal = context.temporal || false;
  const geospatial = context.geospatial || false;
  const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const columns = [];
  
  const idColumnName = generateIdColumnName(words, domain);
  columns.push({
    name: idColumnName,
    dtype: 'categorical',
    is_id: true,
    null_rate: 0
  });
  
  const demographicColumns = generateDemographicColumns(words, domain);
  columns.push(...demographicColumns);
  
  const featureColumns = generateFeatureColumns(words, domain, columns);
  columns.push(...featureColumns);
  
  if (geospatial) {
    columns.push({ name: 'latitude', dtype: 'float', range: [-90, 90], null_rate: 0 });
    columns.push({ name: 'longitude', dtype: 'float', range: [-180, 180], null_rate: 0 });
  }
  
  if (temporal) {
    columns.push({ name: 'timestamp', dtype: 'datetime', null_rate: 0 });
  }
  
  columns.push({
    name: target_column,
    dtype: task_type === 'regression' ? 'float' : 'categorical',
    range: task_type === 'regression' ? target_values : undefined,
    categories: task_type === 'regression' ? undefined : target_values,
    is_target: true,
    null_rate: 0
  });
  
  const label_distribution = generateLabelDistribution(target_values);
  
  const schema = {
    columns,
    constraints: [],
    label_distribution,
    schema_source: 'dynamic_inference'
  };
  
  return {
    ...context,
    schema,
    label_distribution,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'schema_architect_complete',
      data: { column_count: columns.length, source: 'dynamic_inference', domain }
    }]
  };
}

function generateIdColumnName(words, domain) {
  const domainPrefixes = {
    medical: 'patient',
    financial: 'account',
    education: 'student',
    retail: 'customer',
    environmental: 'station',
    social: 'user',
    hr: 'employee',
    telecom: 'subscriber',
    ecommerce: 'order',
    agriculture: 'field',
    technology: 'request',
    sports: 'player',
    engineering: 'machine',
    transportation: 'vehicle',
    scientific: 'sample'
  };
  
  const prefix = domainPrefixes[domain] || words[0] || 'record';
  const sanitized = prefix.replace(/[^a-z]/g, '').toLowerCase();
  
  return `${sanitized}_id`;
}

function generateDemographicColumns(words, domain) {
  const columns = [];
  
  const hasAge = words.some(w => w.includes('age') || w.includes('patient') || w.includes('employee') || w.includes('student'));
  if (hasAge || domain !== 'environmental') {
    columns.push({
      name: 'age',
      dtype: 'int',
      range: [18, 90],
      null_rate: 0
    });
  }
  
  const hasGender = words.some(w => w.includes('gender') || w.includes('patient') || w.includes('employee') || w.includes('customer'));
  if (hasGender || domain !== 'environmental') {
    columns.push({
      name: 'gender',
      dtype: 'categorical',
      categories: ['Male', 'Female'],
      null_rate: 0
    });
  }
  
  return columns;
}

function generateFeatureColumns(words, domain, existingColumns) {
  const columns = [];
  const existingNames = new Set(existingColumns.map(c => c.name));
  
  const topicWords = words.map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length > 2);
  
  const primaryEntity = topicWords[0] || domain;
  
  const measurementTypes = detectMeasurementTypes(words, domain);
  
  for (const measurement of measurementTypes) {
    if (existingNames.has(measurement.name)) continue;
    
    columns.push({
      name: measurement.name,
      dtype: measurement.dtype,
      range: measurement.range,
      null_rate: 0
    });
  }
  
  const count = 4 + Math.floor(Math.random() * 3);
  const genericFeatures = generateGenericFeatures(primaryEntity, count);
  
  for (const feature of genericFeatures) {
    if (existingNames.has(feature.name)) continue;
    columns.push(feature);
  }
  
  return columns;
}

function detectMeasurementTypes(words, domain) {
  const measurements = [];
  const wordSet = new Set(words.map(w => w.replace(/[^a-z]/g, '')));
  
  const medicalMeasurements = [
    { name: 'blood_pressure', dtype: 'float', range: [80, 200] },
    { name: 'heart_rate', dtype: 'int', range: [40, 180] },
    { name: 'temperature', dtype: 'float', range: [35, 41] },
    { name: 'oxygen_saturation', dtype: 'int', range: [70, 100] },
    { name: 'glucose', dtype: 'int', range: [50, 400] },
    { name: 'cholesterol', dtype: 'int', range: [100, 400] },
    { name: 'bmi', dtype: 'float', range: [15, 50] }
  ];
  
  const financialMeasurements = [
    { name: 'income', dtype: 'int', range: [15000, 500000] },
    { name: 'credit_score', dtype: 'int', range: [300, 850] },
    { name: 'loan_amount', dtype: 'int', range: [1000, 1000000] },
    { name: 'balance', dtype: 'float', range: [0, 100000] },
    { name: 'payment_amount', dtype: 'float', range: [0, 10000] }
  ];
  
  const educationMeasurements = [
    { name: 'gpa', dtype: 'float', range: [0, 4] },
    { name: 'score', dtype: 'int', range: [0, 100] },
    { name: 'attendance_rate', dtype: 'int', range: [0, 100] },
    { name: 'study_hours', dtype: 'int', range: [0, 40] }
  ];
  
  const retailMeasurements = [
    { name: 'order_total', dtype: 'float', range: [5, 2000] },
    { name: 'quantity', dtype: 'int', range: [1, 100] },
    { name: 'rating', dtype: 'float', range: [1, 5] },
    { name: 'discount_percent', dtype: 'int', range: [0, 70] },
    { name: 'price', dtype: 'float', range: [1, 1000] }
  ];
  
  const environmentalMeasurements = [
    { name: 'temperature', dtype: 'float', range: [-30, 50] },
    { name: 'humidity', dtype: 'int', range: [0, 100] },
    { name: 'wind_speed', dtype: 'float', range: [0, 150] },
    { name: 'aqi', dtype: 'int', range: [0, 500] },
    { name: 'pm25', dtype: 'float', range: [0, 500] }
  ];
  
  const socialMeasurements = [
    { name: 'followers', dtype: 'int', range: [0, 10000000] },
    { name: 'likes', dtype: 'int', range: [0, 1000000] },
    { name: 'engagement_rate', dtype: 'float', range: [0, 15] },
    { name: 'posts', dtype: 'int', range: [0, 10000] }
  ];
  
  const hrMeasurements = [
    { name: 'salary', dtype: 'int', range: [25000, 500000] },
    { name: 'tenure_years', dtype: 'float', range: [0, 40] },
    { name: 'performance_score', dtype: 'int', range: [1, 5] },
    { name: 'experience_years', dtype: 'int', range: [0, 50] }
  ];
  
  const techMeasurements = [
    { name: 'latency_ms', dtype: 'int', range: [1, 5000] },
    { name: 'error_rate', dtype: 'float', range: [0, 100] },
    { name: 'cpu_usage', dtype: 'int', range: [0, 100] },
    { name: 'memory_usage', dtype: 'int', range: [0, 100] },
    { name: 'requests', dtype: 'int', range: [0, 100000] }
  ];
  
  const domainMeasurements = {
    medical: medicalMeasurements,
    financial: financialMeasurements,
    education: educationMeasurements,
    retail: retailMeasurements,
    environmental: environmentalMeasurements,
    social: socialMeasurements,
    hr: hrMeasurements,
    technology: techMeasurements
  };
  
  const candidates = domainMeasurements[domain] || techMeasurements;
  
  for (const m of candidates) {
    for (const word of words) {
      if (m.name.includes(word) || word.includes(m.name.replace(/_/g, ''))) {
        measurements.push(m);
        break;
      }
    }
  }
  
  if (measurements.length < 3) {
    measurements.push(...candidates.slice(0, 3 - measurements.length));
  }
  
  return measurements.slice(0, 5);
}

function generateGenericFeatures(entity, count) {
  const features = [];
  const used = new Set();
  
  const featureTemplates = [
    { name: 'value', dtype: 'float', range: [0, 100] },
    { name: 'count', dtype: 'int', range: [0, 1000] },
    { name: 'rate', dtype: 'float', range: [0, 100] },
    { name: 'score', dtype: 'int', range: [0, 100] },
    { name: 'level', dtype: 'int', range: [1, 10] },
    { name: 'index', dtype: 'int', range: [0, 1000] },
    { name: 'amount', dtype: 'float', range: [0, 10000] },
    { name: 'percent', dtype: 'float', range: [0, 100] },
    { name: 'total', dtype: 'float', range: [0, 50000] },
    { name: 'ratio', dtype: 'float', range: [0, 1] },
    { name: 'duration', dtype: 'int', range: [0, 1000] },
    { name: 'frequency', dtype: 'int', range: [0, 100] }
  ];
  
  const shuffled = featureTemplates.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const template = shuffled[i];
    const name = i === 0 ? template.name : `${entity}_${template.name}`;
    
    if (!used.has(name)) {
      features.push({
        name,
        dtype: template.dtype,
        range: template.range,
        null_rate: 0
      });
      used.add(name);
    }
  }
  
  return features;
}

function generateLabelDistribution(target_values) {
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
  
  return { 'No': 0.65, 'Yes': 0.35 };
}

module.exports = { process };
