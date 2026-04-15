/**
 * Domain Detector
 * Understands user topic and maps it to appropriate data domain family
 */

const { isKaggleAvailable, isHuggingFaceAvailable, isDataGovAvailable } = require('../src/utils/env');
const { DOMAIN_FAMILIES, getDomainBlueprint, hasBlueprint } = require('./domain-blueprints');

const DOMAIN_FAMILIES_CONFIG = {
  medical: {
    keywords: ['health', 'medical', 'disease', 'patient', 'diagnosis', 'hospital', 'clinic', 'cancer', 'diabetes', 'heart', 'kidney', 'liver', 'breast', 'healthcare', 'clinical', 'symptom', 'treatment', 'chronic'],
    sources: ['kaggle', 'uci', 'huggingface']
  },
  financial: {
    keywords: ['credit', 'loan', 'bank', 'fraud', 'transaction', 'payment', 'default', 'mortgage', 'financial', 'insurance', 'claim', 'risk', 'credit card', 'debt'],
    sources: ['kaggle', 'huggingface', 'data_gov']
  },
  hr: {
    keywords: ['employee', 'attrition', 'job', 'career', 'workforce', 'hr', 'human', 'resource', 'recruit', 'performance', 'salary', 'overtime', 'promotion'],
    sources: ['kaggle', 'huggingface']
  },
  education: {
    keywords: ['student', 'education', 'academic', 'grade', 'learning', 'school', 'university', 'exam', 'performance', 'midterm', 'attendance'],
    sources: ['kaggle', 'uci', 'huggingface']
  },
  ecommerce: {
    keywords: ['customer', 'churn', 'purchase', 'market', 'basket', 'product', 'sales', 'retail', 'ecom', 'shop', 'subscription', 'telecom'],
    sources: ['kaggle', 'uci', 'huggingface']
  },
  nlp_classification: {
    keywords: ['fake', 'news', 'intent', 'sentiment', 'text', 'nlp', 'article', 'headline', 'utterance', 'conversation', 'chatbot', 'fake news', 'classification'],
    sources: ['kaggle', 'huggingface']
  },
  transport: {
    keywords: ['traffic', 'congestion', 'road', 'vehicle', 'transport', 'highway', 'urban', 'commute', 'speed', 'intersection'],
    sources: ['kaggle', 'data_gov']
  }
};

const TOPIC_MAPPINGS = {
  heart_disease: {
    domainFamily: 'medical',
    kaggleSlugs: ['andrewmvd/heart-failure-clinical-data', 'fedesoriano/heart-failure-prediction'],
    uciIds: ['heart-disease'],
    huggingfaceIds: ['mstz/heart_failure', 'aaai530-group6/heart-failure-prediction-dataset'],
    searchTerms: ['heart disease patient clinical']
  },
  diabetes: {
    domainFamily: 'medical',
    kaggleSlugs: ['uciml/pima-indians-diabetes-database'],
    uciIds: ['pima-indians-diabetes'],
    huggingfaceIds: ['scikit-learn/diabetes'],
    searchTerms: ['diabetes patient clinical']
  },
  breast_cancer: {
    domainFamily: 'medical',
    kaggleSlugs: ['merishnasuwal/breast-cancer-prediction-dataset', 'uciml/breast-cancer-wisconsin-data'],
    uciIds: ['breast-cancer-wisconsin'],
    huggingfaceIds: [],
    searchTerms: ['breast cancer tumor diagnosis']
  },
  kidney_disease: {
    domainFamily: 'medical',
    kaggleSlugs: ['imadtasleem/ckd-dataset'],
    uciIds: ['chronic-kidney-disease'],
    huggingfaceIds: [],
    searchTerms: ['chronic kidney disease renal']
  },
  loan_default: {
    domainFamily: 'financial',
    kaggleSlugs: ['laotse/credit-risk-dataset'],
    huggingfaceIds: [],
    searchTerms: ['loan default credit risk']
  },
  credit_card_fraud: {
    domainFamily: 'financial',
    kaggleSlugs: ['mlg-ulb/creditcardfraud'],
    huggingfaceIds: [],
    searchTerms: ['credit card fraud transaction']
  },
  employee_attrition: {
    domainFamily: 'hr',
    kaggleSlugs: [],
    huggingfaceIds: [],
    searchTerms: ['employee attrition hr']
  },
  customer_churn: {
    domainFamily: 'ecommerce',
    kaggleSlugs: ['blastchar/telco-customer-churn'],
    huggingfaceIds: [],
    searchTerms: ['telecom customer churn']
  },
  student_performance: {
    domainFamily: 'education',
    kaggleSlugs: ['stripathy/main-student-performance'],
    uciIds: ['student-performance'],
    huggingfaceIds: [],
    searchTerms: ['student academic performance education']
  },
  fake_news_detection: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    huggingfaceIds: [],
    searchTerms: ['fake news detection']
  },
  intent_classification: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    huggingfaceIds: [],
    searchTerms: ['intent classification chatbot']
  },
  traffic_congestion: {
    domainFamily: 'transport',
    kaggleSlugs: [],
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
