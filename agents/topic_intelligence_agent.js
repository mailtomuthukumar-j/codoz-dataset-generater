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
    search_queries: [
      `${topic} dataset machine learning`,
      `${topic} UCI kaggle dataset`,
      `${topic} open source data`
    ],
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
  
  const domain = inferDomain(words);
  const subdomain = inferSubdomain(words, domain);
  const task_type = inferTaskType(topicLower);
  const target_column = inferTargetColumn(words, domain, task_type);
  const target_values = inferTargetValues(target_column, task_type);
  const key_entities = extractEntities(words, domain);
  const temporal = inferTemporal(words);
  const geospatial = inferGeospatial(words);
  
  return {
    domain,
    subdomain,
    task_type,
    target_column,
    target_values,
    key_entities,
    temporal,
    geospatial
  };
}

function inferDomain(words) {
  const domainIndicators = {
    medical: ['health', 'medical', 'patient', 'doctor', 'hospital', 'clinic', 'disease', 'diagnosis', 'treatment', 'symptom', 'clinical', 'therapy', 'diabetes', 'cancer', 'heart', 'blood', 'glucose', 'cholesterol', 'blood_pressure', 'bmi', 'insulin'],
    financial: ['bank', 'finance', 'credit', 'loan', 'mortgage', 'investment', 'stock', 'market', 'fraud', 'transaction', 'payment', 'insurance', 'risk'],
    education: ['school', 'student', 'university', 'college', 'grade', 'gpa', 'score', 'exam', 'course', 'teacher', 'learning', 'academic', 'education'],
    retail: ['store', 'shop', 'customer', 'purchase', 'sale', 'product', 'retail', 'transaction', 'cart', 'order', 'inventory', 'market'],
    environmental: ['climate', 'weather', 'temperature', 'pollution', 'air', 'water', 'soil', 'carbon', 'emission', 'environmental', 'sustainable', 'green'],
    social: ['social', 'twitter', 'instagram', 'facebook', 'user', 'post', 'follow', 'engagement', 'influencer', 'media', 'content'],
    hr: ['employee', 'hire', 'recruit', 'job', 'career', 'salary', 'performance', 'workforce', 'talent', 'organization', 'management'],
    telecom: ['phone', 'mobile', 'call', 'data', 'network', 'carrier', 'wireless', 'cellular', 'subscription', 'telecom'],
    ecommerce: ['online', 'shop', 'order', 'delivery', 'shipping', 'product', 'review', 'rating', 'amazon', 'website'],
    agriculture: ['farm', 'crop', 'harvest', 'soil', 'plant', 'yield', 'agriculture', 'livestock', 'irrigation', 'farmer'],
    technology: ['software', 'code', 'developer', 'bug', 'server', 'cloud', 'deployment', 'api', 'database', 'programming'],
    sports: ['player', 'team', 'game', 'match', 'score', 'sport', 'athlete', 'tournament', 'league', 'championship'],
    engineering: ['machine', 'engineer', 'manufacture', 'quality', 'production', 'factory', 'maintenance', 'equipment'],
    transportation: ['vehicle', 'driver', 'traffic', 'route', 'transport', 'delivery', 'logistics', 'fleet', 'shipping'],
    scientific: ['research', 'experiment', 'science', 'laboratory', 'scientific', 'hypothesis', 'analysis', 'study']
  };
  
  const scores = {};
  
  for (const [domain, indicators] of Object.entries(domainIndicators)) {
    scores[domain] = 0;
    for (const word of words) {
      for (const indicator of indicators) {
        if (word.includes(indicator) || indicator.includes(word)) {
          scores[domain] += indicator.length / word.length;
        }
      }
    }
  }
  
  let bestDomain = 'technology';
  let bestScore = 0;
  
  for (const [domain, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }
  
  return bestDomain;
}

function inferSubdomain(words, domain) {
  if (words.length === 0) return domain;
  
  const mainWord = words[0];
  
  const subdomains = {
    medical: ['cardiology', 'diabetes', 'oncology', 'neurology', 'psychiatry', 'pediatrics', 'surgery', 'radiology'],
    financial: ['banking', 'investment', 'insurance', 'trading', 'credit', 'lending', 'risk'],
    education: ['primary', 'secondary', 'higher', 'vocational', 'online', 'adult'],
    retail: ['e-commerce', 'brick', 'fashion', 'grocery', 'electronics'],
    environmental: ['climate', 'pollution', 'conservation', 'energy', 'waste'],
    social: ['marketing', 'engagement', 'analytics', 'influencer'],
    hr: ['recruiting', 'training', 'compensation', 'performance'],
    telecom: ['wireless', 'broadband', 'enterprise', 'consumer'],
    ecommerce: ['b2b', 'b2c', 'marketplace', 'subscription'],
    agriculture: ['crop', 'livestock', 'dairy', 'organic'],
    technology: ['saas', 'infrastructure', 'security', 'data'],
    sports: ['football', 'basketball', 'esports', 'baseball'],
    engineering: ['mechanical', 'electrical', 'civil', 'software'],
    transportation: ['automotive', 'logistics', 'public', 'aviation'],
    scientific: ['physics', 'chemistry', 'biology', 'genomics']
  };
  
  const domainSubs = subdomains[domain] || [];
  
  for (const sub of domainSubs) {
    for (const word of words) {
      if (word.includes(sub) || sub.includes(word)) {
        return sub;
      }
    }
  }
  
  return words.slice(0, 2).join(' ');
}

function inferTaskType(topic) {
  if (topic.includes('predict') || topic.includes('forecast')) return 'regression';
  if (topic.includes('detect') || topic.includes('fraud') || topic.includes('anomaly')) return 'anomaly_detection';
  if (topic.includes('cluster') || topic.includes('segment')) return 'clustering';
  if (topic.includes('rank') || topic.includes('score')) return 'ranking';
  if (topic.includes('time') || topic.includes('series') || topic.includes('trend')) return 'time_series';
  return 'classification';
}

function inferTargetColumn(words, domain, task_type) {
  const suffix = task_type === 'regression' ? '_value' : '_status';
  
  const firstWord = words[0] || domain;
  
  if (domain === 'medical') {
    if (task_type === 'classification') return 'diagnosis';
    return 'health_score';
  }
  if (domain === 'financial') {
    if (task_type === 'classification') return 'approval_status';
    return 'credit_score';
  }
  if (domain === 'education') {
    if (task_type === 'classification') return 'pass_status';
    return 'score';
  }
  if (domain === 'retail') {
    if (task_type === 'classification') return 'purchase_status';
    return 'order_value';
  }
  if (domain === 'social') {
    return 'engagement_level';
  }
  if (domain === 'hr') {
    if (task_type === 'classification') return 'attrition_status';
    return 'performance_score';
  }
  
  return `${firstWord}${suffix}`;
}

function inferTargetValues(target_column, task_type) {
  if (task_type === 'regression' || task_type === 'time_series') {
    return [0, 100];
  }
  
  if (target_column.includes('status') || target_column.includes('approved')) {
    return ['Rejected', 'Approved'];
  }
  if (target_column.includes('diagnosis') || target_column.includes('disease')) {
    return ['Negative', 'Positive'];
  }
  if (target_column.includes('risk') || target_column.includes('level')) {
    return ['Low', 'Medium', 'High'];
  }
  if (target_column.includes('fraud') || target_column.includes('default')) {
    return ['Normal', 'Fraudulent'];
  }
  if (target_column.includes('churn') || target_column.includes('attrition')) {
    return ['Retained', 'Churned'];
  }
  if (target_column.includes('pass') || target_column.includes('completion')) {
    return ['Fail', 'Pass'];
  }
  if (target_column.includes('sentiment') || target_column.includes('opinion')) {
    return ['Negative', 'Neutral', 'Positive'];
  }
  
  return ['No', 'Yes'];
}

function extractEntities(words, domain) {
  const entities = [...words];
  
  const entitySuffixes = ['id', 'count', 'rate', 'score', 'amount', 'value', 'status', 'type', 'level'];
  
  for (const word of words) {
    for (const suffix of entitySuffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        entities.push(word);
      }
    }
  }
  
  return [...new Set(entities)].slice(0, 10);
}

function inferTemporal(words) {
  const temporalWords = ['time', 'date', 'daily', 'monthly', 'yearly', 'hourly', 'historical', 'series', 'trend', 'temporal', 'seasonal'];
  
  for (const word of words) {
    for (const temp of temporalWords) {
      if (word.includes(temp)) return true;
    }
  }
  
  return false;
}

function inferGeospatial(words) {
  const geoWords = ['location', 'city', 'region', 'country', 'state', 'area', 'zone', 'latitude', 'longitude', 'gps'];
  const locations = ['california', 'texas', 'europe', 'asia', 'urban', 'rural'];
  
  for (const word of words) {
    for (const geo of geoWords) {
      if (word.includes(geo)) return true;
    }
    for (const loc of locations) {
      if (word.includes(loc)) return true;
    }
  }
  
  return false;
}

module.exports = { process };
