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
  kidney_disease: {
    domainFamily: 'medical',
    kaggleSlugs: ['imadtasleem/ckd-dataset', 'nih-chest-xrays/kaggle'],
    uciIds: ['chronic-kidney-disease'],
    huggingfaceIds: [],
    searchTerms: ['chronic kidney disease renal']
  },
  liver_disease: {
    domainFamily: 'medical',
    kaggleSlugs: ['uciml/indian-liver-patient-dataset', 'mearnsandrew/ilpd-indian-liver-patient-dataset'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['liver disease patient']
  },
  loan_default: {
    domainFamily: 'financial',
    kaggleSlugs: ['laotse/credit-risk-dataset', 'kaggle/h-and-m-personal-fashion-dataset'],
    huggingfaceIds: [],
    searchTerms: ['loan default credit risk']
  },
  credit_card_fraud: {
    domainFamily: 'financial',
    kaggleSlugs: ['mlg-ulb/creditcardfraud', 'nelgiriyewithana/credit-card-fraud-detection'],
    huggingfaceIds: [],
    searchTerms: ['credit card fraud transaction']
  },
  employee_attrition: {
    domainFamily: 'hr',
    kaggleSlugs: ['pavansubhasht/ibm-hr-analytics-attrition-dataset', 'rfree456/employee-attrition'],
    huggingfaceIds: [],
    searchTerms: ['employee attrition hr']
  },
  customer_churn: {
    domainFamily: 'ecommerce',
    kaggleSlugs: ['blastchar/telco-customer-churn', 'binuthomas/telco-customer-churn-prediction'],
    huggingfaceIds: [],
    searchTerms: ['telecom customer churn']
  },
  student_performance: {
    domainFamily: 'education',
    kaggleSlugs: ['stripathy/main-student-performance', 'dev3806/student-performance-data'],
    uciIds: ['student-performance'],
    huggingfaceIds: [],
    searchTerms: ['student academic performance education']
  },
  fake_news_detection: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: ['clic02/fake-news', 'raj89323/fake_news_detection'],
    huggingfaceIds: ['mteb/fake-news', 'google/fake-news-contraction'],
    searchTerms: ['fake news detection']
  },
  intent_classification: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: ['karthiknalam/chatbot-intent-detection', 'mohammadi/intent-classification'],
    huggingfaceIds: ['clinc/oos', 'snips-ai/contextual-speech-recognition'],
    searchTerms: ['intent classification chatbot']
  },
  traffic_congestion: {
    domainFamily: 'transport',
    kaggleSlugs: ['sobhanmoosavi/u-s-traffic-predictor', 'nikhilbhartiya/traffic-prediction'],
    huggingfaceIds: [],
    searchTerms: ['traffic congestion']
  },
  iris: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: ['iris'],
    huggingfaceIds: ['scikit-learn/iris'],
    searchTerms: ['iris flower classification']
  },
  wine: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: ['wine'],
    huggingfaceIds: [],
    searchTerms: ['wine classification']
  },
  // Medical Domain Extensions
  liver_disease: {
    domainFamily: 'medical',
    kaggleSlugs: ['mexwell/frequency-data-for-liver-disorder'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['liver disease patient']
  },
  kidney_failure: {
    domainFamily: 'medical',
    kaggleSlugs: ['imadtasleem/ckd-dataset'],
    uciIds: ['chronic-kidney-disease'],
    huggingfaceIds: [],
    searchTerms: ['kidney failure chronic disease']
  },
  cancer_survival: {
    domainFamily: 'medical',
    kaggleSlugs: ['cancer survival dataset'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['cancer survival prediction']
  },
  blood_pressure_risk: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['blood pressure hypertension']
  },
  stroke_prediction: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['stroke prediction']
  },
  // Financial Domain Extensions
  income_classification: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['income level classification']
  },
  stock_trend: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['stock price prediction']
  },
  insurance_claim: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['insurance claim approval']
  },
  spending_behavior: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['spending behavior classification']
  },
  investment_risk: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['investment risk profiling']
  },
  // E-commerce Domain Extensions
  product_rating: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['product rating prediction']
  },
  order_cancellation: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['order cancellation prediction']
  },
  delivery_delay: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['delivery delay prediction']
  },
  cart_abandonment: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['shopping cart abandonment']
  },
  seller_performance: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['seller performance evaluation']
  },
  customer_lifetime_value: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['customer lifetime value']
  },
  // Education Domain Extensions
  exam_failure: {
    domainFamily: 'education',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['exam failure prediction']
  },
  dropout_prediction: {
    domainFamily: 'education',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['student dropout prediction']
  },
  online_learning: {
    domainFamily: 'education',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['online learning engagement']
  },
  // AI/NLP Extensions
  sentiment_analysis: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['sentiment analysis']
  },
  text_summarization: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['text summarization']
  },
  spam_detection: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['spam detection']
  },
  emotion_detection: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['emotion detection']
  },
  // HR Domain Extensions
  resume_screening: {
    domainFamily: 'hr',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['resume screening']
  },
  job_recommendation: {
    domainFamily: 'hr',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['job recommendation']
  },
  promotion_prediction: {
    domainFamily: 'hr',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['promotion eligibility']
  },
  employee_engagement: {
    domainFamily: 'hr',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['employee engagement analysis']
  },
  interview_success: {
    domainFamily: 'hr',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['interview success prediction']
  },
  // Transport Domain Extensions
  delivery_time: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['delivery time estimation']
  },
  route_optimization: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['route optimization']
  },
  vehicle_accident: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['vehicle accident prediction']
  },
  ride_cancellation: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['ride cancellation']
  },
  // Cybersecurity Domain
  phishing_detection: {
    domainFamily: 'cybersecurity',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['phishing detection']
  },
  malware_detection: {
    domainFamily: 'cybersecurity',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['malware detection']
  },
  network_intrusion: {
    domainFamily: 'cybersecurity',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['network intrusion detection']
  },
  // Social Media Domain
  post_engagement: {
    domainFamily: 'social_media',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['post engagement prediction']
  },
  content_virality: {
    domainFamily: 'social_media',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['content virality prediction']
  },
  influencer_ranking: {
    domainFamily: 'social_media',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['influencer ranking']
  }
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
