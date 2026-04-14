/**
 * Domain Detector
 * Understands user topic and maps it to appropriate data domain
 */

const { isKaggleAvailable, isHuggingFaceAvailable, isDataGovAvailable } = require('../utils/env');

const DOMAINS = {
  medical: {
    keywords: ['health', 'medical', 'disease', 'patient', 'diagnosis', 'hospital', 'clinic', 'cancer', 'diabetes', 'heart', 'kidney', 'liver', 'breast', 'healthcare', 'clinical', 'patient', 'symptom', 'treatment'],
    topics: ['heart_disease', 'diabetes', 'cancer', 'kidney_disease', 'liver_disease', 'breast_cancer', 'medical', 'clinical', 'health'],
    sources: ['kaggle', 'uci', 'huggingface']
  },
  finance: {
    keywords: ['credit', 'loan', 'bank', 'fraud', 'transaction', 'payment', 'default', 'mortgage', 'financial', 'insurance', 'claim', 'risk'],
    topics: ['credit_card_fraud', 'loan_default', 'bank', 'financial', 'insurance_claim', 'fraud'],
    sources: ['kaggle', 'huggingface', 'data_gov']
  },
  retail: {
    keywords: ['customer', 'churn', 'purchase', 'market', 'basket', 'product', 'sales', 'retail', 'ecom', 'shop', 'transaction'],
    topics: ['customer_churn', 'market_basket', 'retail', 'sales', 'e-commerce'],
    sources: ['kaggle', 'uci', 'huggingface']
  },
  hr: {
    keywords: ['employee', 'attrition', 'job', 'career', 'workforce', 'hr', 'human', 'resource', 'recruit', 'performance'],
    topics: ['employee_attrition', 'hr', 'workforce', 'recruitment'],
    sources: ['kaggle', 'huggingface']
  },
  iot: {
    keywords: ['sensor', 'iot', 'machine', 'maintenance', 'device', 'telemetry', 'temperature', 'pressure', 'industrial', 'manufacturing'],
    topics: ['iot_sensor', 'predictive_maintenance', 'machine', 'manufacturing', 'industrial'],
    sources: ['kaggle', 'uci', 'data_gov']
  },
  education: {
    keywords: ['student', 'education', 'academic', 'grade', 'learning', 'school', 'university', 'exam', 'performance'],
    topics: ['student_performance', 'education', 'academic'],
    sources: ['kaggle', 'uci', 'huggingface']
  },
  government: {
    keywords: ['government', 'census', 'demographic', 'population', 'election', 'public', 'policy', 'city', 'transport'],
    topics: ['census', 'demographic', 'government', 'public'],
    sources: ['data_gov', 'kaggle']
  }
};

const TOPIC_MAPPINGS = {
  'heart_disease': {
    primaryDomain: 'medical',
    kaggleSlugs: ['andrewmvd/heart-failure-clinical-data', 'fedesoriano/heart-failure-prediction'],
    uciIds: ['heart-disease'],
    huggingfaceIds: ['mstz/heart_failure', 'aaai530-group6/heart-failure-prediction-dataset'],
    searchTerms: ['heart disease patient clinical']
  },
  'diabetes': {
    primaryDomain: 'medical',
    kaggleSlugs: ['uciml/pima-indians-diabetes-database'],
    uciIds: ['pima-indians-diabetes'],
    huggingfaceIds: ['scikit-learn/diabetes'],
    searchTerms: ['diabetes patient clinical']
  },
  'breast_cancer': {
    primaryDomain: 'medical',
    kaggleSlugs: ['merishnasuwal/breast-cancer-prediction-dataset', 'uciml/breast-cancer-wisconsin-data'],
    uciIds: ['breast-cancer-wisconsin'],
    huggingfaceIds: [],
    searchTerms: ['breast cancer tumor diagnosis']
  },
  'kidney_disease': {
    primaryDomain: 'medical',
    kaggleSlugs: ['imadtasleem/ckd-dataset'],
    uciIds: ['chronic-kidney-disease'],
    huggingfaceIds: [],
    searchTerms: ['chronic kidney disease renal']
  },
  'liver_disease': {
    primaryDomain: 'medical',
    kaggleSlugs: [],
    uciIds: ['ilpd-indian-liver-patient'],
    huggingfaceIds: [],
    searchTerms: ['liver disease patient hepatitis']
  },
  'customer_churn': {
    primaryDomain: 'retail',
    kaggleSlugs: ['blastchar/telco-customer-churn'],
    huggingfaceIds: [],
    searchTerms: ['telecom customer churn']
  },
  'credit_card_fraud': {
    primaryDomain: 'finance',
    kaggleSlugs: ['mlg-ulb/creditcardfraud'],
    huggingfaceIds: [],
    searchTerms: ['credit card fraud transaction']
  },
  'loan_default': {
    primaryDomain: 'finance',
    kaggleSlugs: ['laotse/credit-risk-dataset'],
    huggingfaceIds: [],
    searchTerms: ['loan default credit risk']
  },
  'employee_attrition': {
    primaryDomain: 'hr',
    kaggleSlugs: [],
    huggingfaceIds: [],
    searchTerms: ['employee attrition hr']
  },
  'student_performance': {
    primaryDomain: 'education',
    kaggleSlugs: ['stripathy/main-student-performance'],
    uciIds: ['student-performance'],
    huggingfaceIds: [],
    searchTerms: ['student academic performance education']
  },
  'predictive_maintenance': {
    primaryDomain: 'iot',
    kaggleSlugs: [],
    huggingfaceIds: [],
    searchTerms: ['machine predictive maintenance']
  },
  'iot_sensor': {
    primaryDomain: 'iot',
    kaggleSlugs: [],
    huggingfaceIds: [],
    searchTerms: ['iot sensor temperature']
  },
  'iris': {
    primaryDomain: 'general',
    kaggleSlugs: [],
    uciIds: ['iris'],
    huggingfaceIds: ['scikit-learn/iris'],
    searchTerms: ['iris flower classification']
  },
  'wine': {
    primaryDomain: 'general',
    kaggleSlugs: [],
    uciIds: ['wine'],
    huggingfaceIds: [],
    searchTerms: ['wine classification']
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
      domain: TOPIC_MAPPINGS[topicKey].primaryDomain,
      topicKey,
      mappings: TOPIC_MAPPINGS[topicKey]
    };
  }
  
  for (const [domain, config] of Object.entries(DOMAINS)) {
    const topicWords = normalizedTopic.split(/\s+/);
    const keywordMatches = config.keywords.filter(kw => topicWords.some(w => w.includes(kw) || kw.includes(w)));
    
    if (keywordMatches.length >= 1) {
      return {
        domain,
        topicKey: null,
        mappings: {
          searchTerms: [normalizedTopic],
          sources: config.sources
        }
      };
    }
  }
  
  return {
    domain: 'general',
    topicKey: null,
    mappings: {
      searchTerms: [normalizedTopic],
      sources: ['kaggle', 'uci', 'huggingface']
    }
  };
}

function getAvailableSources() {
  return {
    kaggle: isKaggleAvailable(),
    uci: true,
    huggingface: isHuggingFaceAvailable(),
    dataGov: isDataGovAvailable()
  };
}

module.exports = { detectDomain, getAvailableSources, TOPIC_MAPPINGS, DOMAINS };
