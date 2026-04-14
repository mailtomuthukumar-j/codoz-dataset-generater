const DOMAIN_KEYWORDS = {
  medical: ['diabetes', 'health', 'medical', 'patient', 'disease', 'heart', 'hospital', 'clinical', 'diagnosis', 'blood', 'cancer', 'tumor', 'stroke', 'hypertension', 'cholesterol'],
  financial: ['loan', 'credit', 'fraud', 'financial', 'bank', 'payment', 'mortgage', 'insurance', 'transaction', 'stock', 'investment', 'risk', 'default'],
  education: ['student', 'education', 'school', 'grade', 'gpa', 'exam', 'academic', 'university', 'learning', 'performance', 'college', 'teacher'],
  retail: ['retail', 'customer', 'shopping', 'sales', 'purchase', 'product', 'store', 'cart', 'checkout', 'market', 'inventory', 'churn'],
  environmental: ['pollution', 'climate', 'environmental', 'air', 'weather', 'temperature', 'emission', 'carbon', 'sustainability', 'aqi', 'wildfire', 'flood'],
  social: ['social', 'twitter', 'instagram', 'influencer', 'engagement', 'followers', 'likes', 'posts', 'media', 'tiktok', 'sentiment'],
  hr: ['employee', 'hr', 'hiring', 'recruitment', 'salary', 'performance', 'turnover', 'workforce', 'vacation', 'leave', 'attrition', 'recruitment'],
  telecom: ['telecom', 'mobile', 'phone', 'call', 'data', 'subscription', 'plan', 'network', 'churn', 'usage', 'wireless', 'carrier'],
  ecommerce: ['ecommerce', 'order', 'shipping', 'delivery', 'product', 'review', 'rating', 'cart', 'wishlist', 'purchase', 'amazon', 'shopify'],
  agriculture: ['agriculture', 'crop', 'farm', 'harvest', 'yield', 'soil', 'irrigation', 'livestock', 'production', 'farming', 'livestock'],
  technology: ['software', 'technology', 'code', 'bug', 'repository', 'developer', 'commit', 'deployment', 'server', 'cloud', 'devops', 'infrastructure'],
  sports: ['sports', 'player', 'team', 'game', 'performance', 'match', 'score', 'esports', 'athlete', 'tournament'],
  engineering: ['engineering', 'sensor', 'machine', 'maintenance', 'failure', 'manufacturing', 'quality', 'production', 'assembly'],
  transportation: ['transportation', 'vehicle', 'traffic', 'accident', 'route', 'logistics', 'shipping', 'delivery', 'fleet'],
  scientific: ['scientific', 'research', 'experiment', 'laboratory', 'analysis', 'measurement', 'observation', 'study']
};

const DOMAIN_SUBDOMAINS = {
  medical: ['diabetes', 'heart disease', 'cancer', 'mental health', 'clinical diagnostics', 'public health'],
  financial: ['credit scoring', 'fraud detection', 'loan default', 'risk assessment', 'insurance underwriting'],
  education: ['student performance', 'exam scores', 'course completion', 'learning outcomes'],
  retail: ['customer churn', 'market basket', 'product recommendation', 'sales forecasting'],
  environmental: ['air quality', 'climate change', 'wildfire risk', 'water quality', 'pollution monitoring'],
  social: ['sentiment analysis', 'influencer marketing', 'engagement prediction', 'content virality'],
  hr: ['employee attrition', 'talent acquisition', 'performance prediction', 'workforce analytics'],
  telecom: ['customer churn', 'usage analytics', 'network optimization', 'service quality'],
  ecommerce: ['customer behavior', 'product recommendation', 'demand forecasting', 'return prediction'],
  agriculture: ['crop yield', 'soil analysis', 'livestock management', 'precision farming'],
  technology: ['software quality', 'infrastructure monitoring', 'security analytics', 'code quality'],
  sports: ['player performance', 'team strategy', 'injury prediction', 'game outcome'],
  engineering: ['predictive maintenance', 'quality control', 'process optimization'],
  transportation: ['traffic prediction', 'accident analysis', 'route optimization', 'fleet management'],
  scientific: ['experimental analysis', 'genomic research', 'physics measurement']
};

function process(context) {
  const topic = context.topic;
  
  const analysis = analyzeTopic(topic);
  
  return {
    ...context,
    domain: analysis.domain,
    subdomain: analysis.subdomain,
    task_type: analysis.task_type,
    target_column: analysis.target_column,
    target_values: analysis.target_values,
    key_entities: analysis.key_entities,
    temporal: analysis.temporal,
    geospatial: analysis.geospatial,
    search_queries: analysis.search_queries,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'topic_intelligence_complete',
      data: { domain: analysis.domain, subdomain: analysis.subdomain, task_type: analysis.task_type }
    }]
  };
}

function analyzeTopic(topic) {
  const topicLower = topic.toLowerCase();
  const words = topicLower.split(/\s+/).filter(w => w.length > 2);
  
  let domain = 'other';
  let maxScore = 0;
  
  for (const [d, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      for (const word of words) {
        if (word.includes(keyword) || keyword.includes(word)) {
          score++;
        }
      }
    }
    if (score > maxScore) {
      maxScore = score;
      domain = d;
    }
  }
  
  const subdomain = detectSubdomain(topicLower, domain);
  const task_type = detectTaskType(topicLower);
  const target_column = generateTargetColumn(topicLower, task_type);
  const target_values = generateTargetValues(topicLower, task_type, target_column);
  const key_entities = extractKeyEntities(topicLower, domain);
  const temporal = detectTemporal(topicLower);
  const geospatial = detectGeospatial(topicLower);
  const search_queries = generateSearchQueries(topic);
  
  return {
    domain,
    subdomain,
    task_type,
    target_column,
    target_values,
    key_entities,
    temporal,
    geospatial,
    search_queries
  };
}

function detectSubdomain(topic, domain) {
  const subdomains = DOMAIN_SUBDOMAINS[domain] || [];
  
  for (const sd of subdomains) {
    const sdLower = sd.toLowerCase();
    for (const word of topic.split(/\s+/)) {
      if (sdLower.includes(word) || word.includes(sdLower.replace(/\s+/g, ''))) {
        return sd;
      }
    }
  }
  
  const word1 = topic.split(/\s+/)[0] || 'general';
  const word2 = topic.split(/\s+/)[1] || 'data';
  return `${word1} ${word2}`;
}

function detectTaskType(topic) {
  if (topic.includes('predict') || topic.includes('forecast')) return 'regression';
  if (topic.includes('detect') || topic.includes('fraud') || topic.includes('anomaly')) return 'anomaly_detection';
  if (topic.includes('cluster') || topic.includes('segment')) return 'clustering';
  if (topic.includes('rank') || topic.includes('score')) return 'ranking';
  if (topic.includes('time') || topic.includes('series')) return 'time_series';
  return 'classification';
}

function generateTargetColumn(topic, task_type) {
  const mappings = {
    'classification': { keywords: ['churn', 'default', 'fraud', 'risk', 'diagnosis'], default: 'target' },
    'regression': { keywords: ['price', 'cost', 'income', 'score', 'rating'], default: 'value' },
    'anomaly_detection': { keywords: ['fraud', 'defect', 'failure'], default: 'is_anomaly' },
    'clustering': { keywords: ['segment', 'group', 'type'], default: 'cluster' },
    'ranking': { keywords: ['priority', 'importance', 'relevance'], default: 'rank' },
    'time_series': { keywords: ['forecast', 'trend'], default: 'forecast' }
  };
  
  const config = mappings[task_type] || mappings.classification;
  
  for (const keyword of config.keywords) {
    if (topic.includes(keyword)) {
      return snakeCase(keyword);
    }
  }
  
  return config.default;
}

function generateTargetValues(topic, task_type, target_column) {
  if (task_type === 'regression' || task_type === 'time_series') {
    return [0, 100];
  }
  
  if (task_type === 'anomaly_detection') {
    return [0, 1];
  }
  
  if (target_column.includes('churn') || target_column.includes('attrition')) {
    return ['No', 'Yes'];
  }
  if (target_column.includes('fraud') || target_column.includes('default')) {
    return ['Legitimate', 'Fraudulent'];
  }
  if (target_column.includes('risk')) {
    return ['Low', 'Medium', 'High'];
  }
  if (target_column.includes('diagnosis')) {
    return ['Negative', 'Positive'];
  }
  
  return [0, 1];
}

function extractKeyEntities(topic, domain) {
  const entityPatterns = {
    medical: ['patient', 'diagnosis', 'symptom', 'treatment', 'test', 'condition', 'glucose', 'blood_pressure', 'bmi', 'cholesterol', 'heart_rate'],
    financial: ['account', 'transaction', 'payment', 'loan', 'credit', 'balance', 'income', 'debt', 'interest', 'score'],
    education: ['student', 'course', 'grade', 'score', 'gpa', 'attendance', 'enrollment', 'exam'],
    retail: ['customer', 'product', 'order', 'purchase', 'price', 'quantity', 'discount', 'rating'],
    environmental: ['temperature', 'humidity', 'emission', 'pollutant', 'concentration', 'reading', 'level'],
    social: ['user', 'post', 'engagement', 'followers', 'likes', 'shares', 'comments'],
    hr: ['employee', 'salary', 'tenure', 'performance', 'department', 'position'],
    telecom: ['subscriber', 'plan', 'usage', 'minutes', 'data', 'charges'],
    ecommerce: ['order', 'product', 'customer', 'shipping', 'delivery', 'review'],
    agriculture: ['crop', 'yield', 'soil', 'rainfall', 'temperature', 'fertilizer'],
    technology: ['user', 'request', 'error', 'latency', 'throughput', 'deployment'],
    sports: ['player', 'team', 'score', 'performance', 'match', 'game'],
    engineering: ['machine', 'sensor', 'temperature', 'pressure', 'vibration', 'failure'],
    transportation: ['vehicle', 'route', 'driver', 'distance', 'time', 'speed'],
    scientific: ['measurement', 'observation', 'sample', 'experiment', 'result']
  };
  
  const domainEntities = entityPatterns[domain] || [];
  const found = [];
  
  for (const entity of domainEntities) {
    if (topic.includes(entity) || entity.includes(topic.split(/\s+/)[0])) {
      found.push(entity);
    }
  }
  
  if (found.length < 3) {
    const genericEntities = ['value', 'metric', 'measure', 'score', 'count', 'rate', 'index'];
    for (const entity of genericEntities.slice(0, 5 - found.length)) {
      found.push(entity);
    }
  }
  
  return found.slice(0, 7);
}

function detectTemporal(topic) {
  const temporalKeywords = ['time', 'date', 'daily', 'monthly', 'yearly', 'historical', 'temporal', 'series', 'trend'];
  return temporalKeywords.some(kw => topic.includes(kw));
}

function detectGeospatial(topic) {
  const geoKeywords = ['location', 'city', 'state', 'country', 'region', 'latitude', 'longitude', 'geographic', 'spatial', 'california', 'us', 'europe'];
  const regions = ['california', 'texas', 'new york', 'europe', 'asia', 'africa', 'north america'];
  
  if (regions.some(r => topic.includes(r))) return true;
  return geoKeywords.some(kw => topic.includes(kw));
}

function generateSearchQueries(topic) {
  const queries = [
    `${topic} dataset kaggle`,
    `${topic} UCI machine learning`,
    `${topic} open source dataset`
  ];
  
  return queries;
}

function snakeCase(str) {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[\s-]+/g, '_')
    .replace(/^_/, '')
    .toLowerCase();
}

module.exports = { process };
