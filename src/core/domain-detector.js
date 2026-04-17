/**
 * Domain Detector
 * Understands user topic and maps it to appropriate data domain family
 */

const { isKaggleAvailable, isHuggingFaceAvailable, isDataGovAvailable } = require('../utils/env');
const { DOMAIN_FAMILIES, getDomainBlueprint, hasBlueprint } = require('./domain-blueprints');

const DOMAIN_FAMILIES_CONFIG = {
  medical: {
    keywords: ['health', 'medical', 'disease', 'patient', 'diagnosis', 'hospital', 'clinic', 'cancer', 'diabetes', 'heart', 'kidney', 'liver', 'breast', 'healthcare', 'clinical', 'symptom', 'treatment', 'chronic', 'blood pressure', 'stroke', 'icu', 'anemia', 'respiratory', 'lung', 'cancer', 'survival', 'tumor', 'organ', 'failure', 'risk', 'prediction', 'detection', 'severity', 'analysis'],
    sources: ['kaggle', 'uci', 'huggingface']
  },
  financial: {
    keywords: ['credit', 'loan', 'bank', 'fraud', 'transaction', 'payment', 'default', 'mortgage', 'financial', 'insurance', 'claim', 'risk', 'credit card', 'debt', 'income', 'stock', 'price', 'investment', 'spending', 'score', 'approval', 'analysis', 'trend'],
    sources: ['kaggle', 'huggingface', 'data_gov']
  },
  hr: {
    keywords: ['employee', 'attrition', 'job', 'career', 'workforce', 'hr', 'human', 'resource', 'recruit', 'performance', 'salary', 'overtime', 'promotion', 'resume', 'screening', 'candidate', 'interview', 'engagement', 'workload', 'stress', 'ranking'],
    sources: ['kaggle', 'huggingface']
  },
  education: {
    keywords: ['student', 'education', 'academic', 'grade', 'learning', 'school', 'university', 'exam', 'performance', 'midterm', 'attendance', 'dropout', 'scholarship', 'success', 'failure', 'difficulty', 'engagement', 'study', 'habit'],
    sources: ['kaggle', 'uci', 'huggingface']
  },
  ecommerce: {
    keywords: ['customer', 'churn', 'purchase', 'market', 'basket', 'product', 'sales', 'retail', 'ecom', 'shop', 'subscription', 'telecom', 'order', 'delivery', 'rating', 'discount', 'cart', 'abandonment', 'seller', 'demand', 'lifetime', 'value', 'engagement'],
    sources: ['kaggle', 'uci', 'huggingface']
  },
  nlp_classification: {
    keywords: ['fake', 'news', 'intent', 'sentiment', 'text', 'nlp', 'article', 'headline', 'utterance', 'conversation', 'chatbot', 'classification', 'summarization', 'question', 'answering', 'translation', 'spam', 'emotion', 'instruction', 'language', 'prompt'],
    sources: ['kaggle', 'huggingface']
  },
  transport: {
    keywords: ['traffic', 'congestion', 'road', 'vehicle', 'transport', 'highway', 'urban', 'commute', 'speed', 'intersection', 'delivery', 'route', 'accident', 'fuel', 'ride', 'cancellation', 'warehouse', 'logistics', 'fleet', 'optimization'],
    sources: ['kaggle', 'data_gov']
  },
  cybersecurity: {
    keywords: ['fraud', 'phishing', 'malware', 'intrusion', 'fake account', 'spam', 'breach', 'login', 'anomaly', 'bot', 'cyber', 'attack', 'detection', 'security', 'classification', 'risk'],
    sources: ['kaggle', 'huggingface']
  },
  social_media: {
    keywords: ['fake news', 'post', 'engagement', 'user growth', 'virality', 'comment', 'influencer', 'trend', 'hate speech', 'retention', 'social', 'network', 'behavior', 'content', 'platform'],
    sources: ['kaggle', 'huggingface']
  },
  general: {
    keywords: ['iris', 'wine', 'generic', 'classification', 'regression'],
    sources: ['kaggle', 'uci', 'huggingface']
  }
};

const TOPIC_MAPPINGS = {
  heart_disease: {
    domainFamily: 'medical',
    kaggleSlugs: ['andrewmvd/heart-failure-clinical-data', 'fedesoriano/heart-failure-prediction'],
    uciIds: ['heart-disease'],
    huggingfaceIds: ['mstz/heart_failure', 'scikit-learn/heart_disease'],
    searchTerms: ['heart disease patient clinical']
  },
  diabetes: {
    domainFamily: 'medical',
    kaggleSlugs: ['uciml/pima-indians-diabetes-database', 'v程度不大/pima-indians-diabetes-dataset', 'imadeshpande/diabetes-dataset'],
    uciIds: ['pima-indians-diabetes'],
    huggingfaceIds: ['scikit-learn/diabetes'],
    searchTerms: ['diabetes patient clinical']
  },
  breast_cancer: {
    domainFamily: 'medical',
    kaggleSlugs: ['merishnasuwal/breast-cancer-prediction-dataset', 'uciml/breast-cancer-wisconsin-data', 'ahmadtabassom/breast-cancer-dataset'],
    uciIds: ['breast-cancer-wisconsin'],
    huggingfaceIds: ['scikit-learn/breast_cancer'],
    searchTerms: ['breast cancer tumor diagnosis']
  },
  iris_flower: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: ['iris'],
    huggingfaceIds: ['scikit-learn/iris'],
    searchTerms: ['iris flower classification']
  },
  iris: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: ['iris'],
    huggingfaceIds: ['scikit-learn/iris'],
    searchTerms: ['iris flower classification']
  },
  wine_quality: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: ['wine'],
    huggingfaceIds: [],
    searchTerms: ['wine classification quality']
  },
  wine: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: ['wine'],
    huggingfaceIds: [],
    searchTerms: ['wine classification']
  },
  student_performance: {
    domainFamily: 'education',
    kaggleSlugs: ['stripathy/main-student-performance', 'dev3806/student-performance-data'],
    uciIds: ['student-performance'],
    huggingfaceIds: [],
    searchTerms: ['student academic performance education']
  },
  house_price_prediction: {
    domainFamily: 'financial',
    kaggleSlugs: ['muthukrishnan002/house-price-prediction-uci-dataset'],
    uciIds: [],
    huggingfaceIds: ['scikit-learn/california_housing'],
    searchTerms: ['house price prediction real estate']
  },
  stock_market_data: {
    domainFamily: 'financial',
    kaggleSlugs: ['ramrajrajpal/nyse-stock-data'],
    uciIds: [],
    huggingfaceIds: ['rajaharyard/nyse-stock-data'],
    searchTerms: ['stock market data finance']
  },
  stock: {
    domainFamily: 'financial',
    kaggleSlugs: ['ramrajrajpal/nyse-stock-data'],
    uciIds: [],
    huggingfaceIds: ['rajaharyard/nyse-stock-data'],
    searchTerms: ['stock market data finance']
  },
  bank_loan_approval: {
    domainFamily: 'financial',
    kaggleSlugs: ['laotse/credit-risk-dataset'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['bank loan approval credit']
  },
  credit_card_fraud: {
    domainFamily: 'financial',
    kaggleSlugs: ['mlg-ulb/creditcardfraud', 'nelgiriyewithana/credit-card-fraud-detection'],
    huggingfaceIds: [],
    searchTerms: ['credit card fraud transaction']
  },
  customer_churn: {
    domainFamily: 'ecommerce',
    kaggleSlugs: ['blastchar/telco-customer-churn', 'binuthomas/telco-customer-churn-prediction'],
    huggingfaceIds: [],
    searchTerms: ['telecom customer churn']
  },
  sales_forecasting: {
    domainFamily: 'ecommerce',
    kaggleSlugs: ['utkarshthaker/store-item-demand-forecasting'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['sales forecasting demand']
  },
  weather_prediction: {
    domainFamily: 'weather',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: ['openvax/weather'],
    searchTerms: ['weather prediction climate']
  },
  cryptocurrency_price: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: ['arthurneuron/cryptocurrency-futures-ohlcv-dataset-1m'],
    searchTerms: ['cryptocurrency price bitcoin']
  },
  air_quality_index: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: ['dheeraj765/air-quality-index-delhi'],
    searchTerms: ['air quality index pollution']
  },
  traffic_accident_data: {
    domainFamily: 'transport',
    kaggleSlugs: ['usmanrazaTraffic/road-traffic-accidents'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['traffic accident data']
  },
  mobile_price_classification: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['mobile price classification']
  },
  fake_news_detection: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: ['clic02/fake-news', 'raj89323/fake_news_detection'],
    huggingfaceIds: ['mteb/fake-news'],
    searchTerms: ['fake news detection']
  },
loan_default_risk: {
    domainFamily: 'financial',
    kaggleSlugs: ['laotse/credit-risk-dataset'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['loan default risk prediction']
  },
  ecommerce_customer_behavior: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['ecommerce customer behavior']
  },
  traffic_accident_data: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: ['usmanraza/road-traffic-accidents'],
    searchTerms: ['traffic accident data']
  },
  mobile_price_classification: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['mobile price classification phone']
  },
  // Fallback - will search dynamically if no data found
  traffic_accident: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['traffic accident road']
  },
  mobile_price: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['mobile price phone']
  },
};

function detectDomain(topic) {
  const normalizedTopic = topic.toLowerCase().trim();
  const normalizedWithSpace = normalizedTopic.replace(/_/g, ' ');
  const normalizedWithUnderscore = normalizedTopic.replace(/ /g, '_');
  
  const topicKey = Object.keys(TOPIC_MAPPINGS).find(key => 
    key === normalizedTopic ||
    key === normalizedWithUnderscore ||
    key === normalizedWithSpace ||
    normalizedTopic.includes(key.replace(/_/g, ' ')) ||
    key.replace(/_/g, ' ').includes(normalizedTopic) ||
    normalizedWithSpace.includes(key.replace(/_/g, ' '))
  );
  
  if (topicKey) {
    return {
      domainFamily: TOPIC_MAPPINGS[topicKey].domainFamily,
      topicKey,
      mappings: TOPIC_MAPPINGS[topicKey],
      hasBlueprint: true
    };
  }
  
  for (const [family, config] of Object.entries(DOMAIN_FAMILIES_CONFIG)) {
    const topicWords = normalizedTopic.split(/\s+/);
    const keywordMatches = config.keywords.filter(kw => 
      topicWords.some(w => w.includes(kw) || kw.includes(w))
    );
    
    if (keywordMatches.length >= 1) {
      return {
        domainFamily: family,
        topicKey: null,
        mappings: {
          searchTerms: [normalizedTopic],
          sources: config.sources
        },
        hasBlueprint: false
      };
    }
  }
  
  return {
    domainFamily: 'unknown',
    topicKey: null,
    mappings: {
      searchTerms: [normalizedTopic],
      sources: ['kaggle', 'uci', 'huggingface']
    },
    hasBlueprint: false
  };
}

function getDomainBlueprintForTopic(topic) {
  const detected = detectDomain(topic);
  
  if (hasBlueprint(topic)) {
    return getDomainBlueprint(topic);
  }
  
  if (hasBlueprint(detected.topicKey)) {
    return getDomainBlueprint(detected.topicKey);
  }
  
  return null;
}

function getAvailableSources() {
  return {
    kaggle: isKaggleAvailable(),
    uci: true,
    huggingface: isHuggingFaceAvailable(),
    dataGov: isDataGovAvailable()
  };
}

function isNLPFamily(topic) {
  const detected = detectDomain(topic);
  return detected.domainFamily === 'nlp_classification';
}

function isFinancialFamily(topic) {
  const detected = detectDomain(topic);
  return detected.domainFamily === 'financial';
}

function isMedicalFamily(topic) {
  const detected = detectDomain(topic);
  return detected.domainFamily === 'medical';
}

function isTransportFamily(topic) {
  const detected = detectDomain(topic);
  return detected.domainFamily === 'transport';
}

module.exports = { 
  detectDomain, 
  getAvailableSources, 
  TOPIC_MAPPINGS, 
  DOMAIN_FAMILIES_CONFIG,
  getDomainBlueprintForTopic,
  hasBlueprint,
  isNLPFamily,
  isFinancialFamily,
  isMedicalFamily,
  isTransportFamily
};
