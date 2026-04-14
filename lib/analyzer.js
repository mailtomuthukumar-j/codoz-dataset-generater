const DOMAIN_FEATURES = {
  medical: {
    entities: ['patient', 'diagnosis', 'treatment', 'symptom', 'test', 'condition', 'vital', 'record'],
    numeric_features: ['age', 'weight', 'height', 'pressure', 'level', 'rate', 'count', 'duration', 'score', 'index'],
    categorical_features: ['gender', 'blood_type', 'status', 'stage', 'type', 'category', 'group'],
    outcomes: ['outcome', 'diagnosis', 'prognosis', 'result', 'severity', 'risk']
  },
  financial: {
    entities: ['account', 'transaction', 'payment', 'loan', 'credit', 'fraud', 'balance', 'income'],
    numeric_features: ['amount', 'balance', 'income', 'debt', 'rate', 'score', 'limit', 'payment', 'fee', 'interest'],
    categorical_features: ['status', 'type', 'category', 'method', 'account_type', 'risk_level'],
    outcomes: ['default', 'approved', 'fraud', 'risk_rating', 'status']
  },
  education: {
    entities: ['student', 'course', 'grade', 'performance', 'enrollment', 'attendance'],
    numeric_features: ['score', 'grade', 'gpa', 'attendance', 'hours', 'credits', 'rank', 'percentile'],
    categorical_features: ['level', 'major', 'status', 'enrollment', 'term', 'department'],
    outcomes: ['pass', 'fail', 'gpa', 'retention', 'enrollment_status']
  },
  retail: {
    entities: ['customer', 'product', 'order', 'purchase', 'transaction', 'cart', 'checkout'],
    numeric_features: ['quantity', 'price', 'total', 'discount', 'rating', 'reviews', 'sales', 'revenue'],
    categorical_features: ['category', 'status', 'segment', 'channel', 'payment_method', 'priority'],
    outcomes: ['churn', 'purchase', 'return', 'satisfaction', 'loyalty']
  },
  environmental: {
    entities: ['sensor', 'measurement', 'reading', 'station', 'location', 'emission'],
    numeric_features: ['level', 'concentration', 'temperature', 'humidity', 'pressure', 'index', 'reading'],
    categorical_features: ['location', 'condition', 'severity', 'category', 'zone', 'status'],
    outcomes: ['quality', 'severity', 'alert_level', 'compliance']
  },
  social: {
    entities: ['user', 'post', 'engagement', 'follower', 'interaction', 'content'],
    numeric_features: ['count', 'rate', 'engagement', 'followers', 'following', 'impressions', 'reach'],
    categorical_features: ['platform', 'content_type', 'verified', 'category', 'sentiment'],
    outcomes: ['engagement', 'influence', 'virality', 'conversion']
  },
  hr: {
    entities: ['employee', 'candidate', 'position', 'department', 'evaluation', 'compensation'],
    numeric_features: ['salary', 'experience', 'tenure', 'performance', 'score', 'rating', 'hours'],
    categorical_features: ['department', 'level', 'status', 'type', 'employment_type', 'shift'],
    outcomes: ['attrition', 'performance', 'promotion', 'satisfaction']
  },
  telecom: {
    entities: ['subscriber', 'plan', 'usage', 'connection', 'device', 'service'],
    numeric_features: ['minutes', 'data', 'sms', 'charges', 'tenure', 'calls', 'sessions'],
    categorical_features: ['plan_type', 'status', 'service_type', 'device', 'network', 'contract'],
    outcomes: ['churn', 'upgrade', 'downgrade', 'satisfaction']
  },
  ecommerce: {
    entities: ['order', 'product', 'customer', 'shipment', 'review', 'inventory'],
    numeric_features: ['price', 'quantity', 'discount', 'revenue', 'rating', 'delivery_time'],
    categorical_features: ['category', 'status', 'payment', 'shipping', 'priority', 'channel'],
    outcomes: ['conversion', 'return', 'satisfaction', 'repeat_purchase']
  },
  agriculture: {
    entities: ['crop', 'field', 'yield', 'soil', 'weather', 'harvest', 'livestock'],
    numeric_features: ['yield', 'area', 'production', 'temperature', 'rainfall', 'ph', 'moisture'],
    categorical_features: ['crop_type', 'soil_type', 'season', 'region', 'irrigation', 'method'],
    outcomes: ['yield', 'quality', 'suitability', 'harvest_status']
  },
  technology: {
    entities: ['user', 'system', 'component', 'metric', 'deployment', 'incident'],
    numeric_features: ['latency', 'throughput', 'usage', 'error_rate', 'count', 'duration', 'score'],
    categorical_features: ['status', 'severity', 'type', 'category', 'environment', 'priority'],
    outcomes: ['reliability', 'performance', 'availability', 'incident_status']
  }
};

const DOMAIN_KEYWORDS = {
  medical: ['diabetes', 'health', 'medical', 'patient', 'disease', 'heart', 'hospital', 'clinical', 'diagnosis', 'blood', 'cancer', 'tumor'],
  financial: ['loan', 'credit', 'fraud', 'financial', 'bank', 'payment', 'mortgage', 'insurance', 'transaction', 'stock', 'investment'],
  education: ['student', 'education', 'school', 'grade', 'gpa', 'exam', 'academic', 'university', 'learning', 'performance', 'college'],
  retail: ['retail', 'customer', 'shopping', 'sales', 'purchase', 'product', 'store', 'cart', 'checkout', 'market'],
  environmental: ['pollution', 'climate', 'environmental', 'air', 'weather', 'temperature', 'emission', 'carbon', 'sustainability', 'aqi'],
  social: ['social', 'twitter', 'instagram', 'influencer', 'engagement', 'followers', 'likes', 'posts', 'media', 'tiktok'],
  hr: ['employee', 'hr', 'hiring', 'recruitment', 'salary', 'performance', 'turnover', 'workforce', 'vacation', 'leave', 'attrition'],
  telecom: ['telecom', 'mobile', 'phone', 'call', 'data', 'subscription', 'plan', 'network', 'churn', 'usage', 'wireless'],
  ecommerce: ['ecommerce', 'order', 'shipping', 'delivery', 'product', 'review', 'rating', 'cart', 'wishlist', 'purchase', 'amazon'],
  agriculture: ['agriculture', 'crop', 'farm', 'harvest', 'yield', 'soil', 'irrigation', 'livestock', 'production', 'farming'],
  technology: ['software', 'technology', 'code', 'bug', 'repository', 'developer', 'commit', 'deployment', 'server', 'cloud', 'devops']
};

function analyze(topic) {
  const topicLower = topic.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const topicWords = topicLower.split(/\s+/).filter(w => w.length > 2);
  
  let detectedDomain = 'other';
  let maxScore = 0;
  let matchedKeywords = [];
  
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0;
    let matches = [];
    
    for (const keyword of keywords) {
      for (const word of topicWords) {
        if (word.includes(keyword) || keyword.includes(word)) {
          score++;
          if (!matches.includes(keyword)) {
            matches.push(keyword);
          }
        }
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      detectedDomain = domain;
      matchedKeywords = matches;
    }
  }
  
  const taskType = detectTaskType(topicLower);
  
  return {
    topic,
    topicWords,
    domain: detectedDomain,
    matchedKeywords,
    taskType,
    confidence: Math.min(maxScore / 5, 1)
  };
}

function detectTaskType(topic) {
  if (topic.includes('predict') || topic.includes('forecast') || topic.includes('prediction')) {
    return 'regression';
  }
  if (topic.includes('detect') || topic.includes('fraud') || topic.includes('anomaly')) {
    return 'classification';
  }
  if (topic.includes('cluster') || topic.includes('segment')) {
    return 'clustering';
  }
  return 'classification';
}

function getDomainFeatures(domain) {
  return DOMAIN_FEATURES[domain] || DOMAIN_FEATURES.technology;
}

module.exports = { analyze, getDomainFeatures, DOMAIN_KEYWORDS };
