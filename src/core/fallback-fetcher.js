/**
 * Fallback Fetcher
 * Handles cases when no dataset is found from primary sources
 * Uses domain blueprints to generate logically consistent synthetic data
 */

const logger = require('../utils/logger');
const { detectDomain } = require('./domain-detector');
const { DOMAIN_BLUEPRINTS, getDomainBlueprint, hasBlueprint } = require('./domain-blueprints');
const { generateDomainRow } = require('./domain-rules-engine');

const KNOWN_PUBLIC_DATASETS = {
  // MEDICAL DOMAIN
  heart_disease_prediction: [
    { source: 'uci', id: 'heart-disease', url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/cleveland.data' },
    { source: 'kaggle', slug: 'andrewmvd/heart-failure-clinical-data' },
    { source: 'huggingface', id: 'mstz/heart_failure' }
  ],
  diabetes_prediction: [
    { source: 'kaggle', slug: 'uciml/pima-indians-diabetes-database' },
    { source: 'huggingface', id: 'scikit-learn/diabetes' }
  ],
  breast_cancer_detection: [
    { source: 'kaggle', slug: 'uciml/breast-cancer-wisconsin-data' },
    { source: 'huggingface', id: 'scikit-learn/breast_cancer' }
  ],
  lung_cancer_prediction: [
    { source: 'kaggle', slug: 'deepanshu291/lung-cancer-dataset' },
    { source: 'kaggle', slug: 'yasserhussein/lung-cancer-dataset' }
  ],
  kidney_disease_classification: [
    { source: 'kaggle', slug: 'marfedah/ckd-dataset' }
  ],
  liver_disease_prediction: [
    { source: 'kaggle', slug: 'uciml/indian-liver-patient-dataset' }
  ],
  stroke_risk_prediction: [
    { source: 'kaggle', slug: 'godsoncrazyx/stroke-prediction-dataset' }
  ],
  brain_tumor_detection: [
    { source: 'kaggle', slug: 'ahmedmohamed600/brain-tumor-dataset' }
  ],
  covid19_risk_analysis: [
    { source: 'kaggle', slug: 'saurabh225covid19/covid19-coronavirus-dataset' }
  ],
  xray_pneumonia_detection: [
    { source: 'kaggle', slug: 'paultimotymooney/chest-xray-pneumonia' }
  ],

  // FINANCIAL
  stock_market_prediction: [
    { source: 'kaggle', slug: 'ramrajrajpal/nyse-stock-data' },
    { source: 'huggingface', id: 'rajaharyard/nyse-stock-data' }
  ],
  crypto_price_prediction: [
    { source: 'huggingface', id: 'arthurneuron/cryptocurrency-futures-ohlcv-dataset-1m' }
  ],
  bank_loan_approval: [
    { source: 'kaggle', slug: 'laotse/credit-risk-dataset' }
  ],
  credit_card_fraud_detection: [
    { source: 'kaggle', slug: 'mlg-ulb/creditcardfraud' },
    { source: 'kaggle', slug: 'nelgiriyewithana/credit-card-fraud-detection' }
  ],
  credit_score_prediction: [
    { source: 'kaggle', slug: 'laotse/credit-risk-dataset' }
  ],

  // ECOMMERCE
  customer_churn_prediction: [
    { source: 'kaggle', slug: 'blastchar/telco-customer-churn' },
    { source: 'kaggle', slug: 'binuthomas/telco-customer-churn-prediction' }
  ],
  customer_lifetime_value: [
    { source: 'kaggle', slug: 'blastchar/telco-customer-churn' }
  ],
  sales_forecasting: [
    { source: 'kaggle', slug: 'utkarshthaker/store-item-demand-forecasting' }
  ],
  product_demand_prediction: [
    { source: 'kaggle', slug: 'utkarshthaker/store-item-demand-forecasting' }
  ],
  ad_click_prediction: [
    { source: 'kaggle', slug: 'avsys-ai-campaign-marketing-dataset' }
  ],

  // REAL ESTATE
  house_price_prediction: [
    { source: 'kaggle', slug: 'muthukrishnan002/house-price-prediction-uci-dataset' },
    { source: 'huggingface', id: 'scikit-learn/california_housing' }
  ],
  real_estate_value_prediction: [
    { source: 'huggingface', id: 'scikit-learn/california_housing' }
  ],
  rental_price_estimation: [
    { source: 'kaggle', slug: 'muthukrishnan002/house-price-prediction-uci-dataset' }
  ],

  // TRANSPORT
  traffic_congestion_prediction: [
    { source: 'kaggle', slug: 'usmanrazaTraffic/road-traffic-accidents' }
  ],
  accident_hotspot_detection: [
    { source: 'kaggle', slug: 'usmanrazaTraffic/road-traffic-accidents' }
  ],
  route_optimization_system: [
    { source: 'kaggle', slug: 'usmanrazaTraffic/road-traffic-accidents' }
  ],

  // NLP
  fake_news_detection: [
    { source: 'kaggle', slug: 'clic02/fake-news' },
    { source: 'huggingface', id: 'mteb/fake-news' }
  ],
  sentiment_analysis_dataset: [
    { source: 'kaggle', slug: 'sentimentlabelledteddyoscar/amazon-reviews-multi' }
  ],
  spam_email_detection: [
    { source: 'kaggle', slug: 'lakshmi25n/email-spam-detection-dataset' }
  ],
  toxic_comment_classification: [
    { source: 'kaggle', slug: 'google-poison-dan' }
  ],
  hate_speech_detection: [
    { source: 'kaggle', slug: 'chatgpt-supported-hate-speech' }
  ],

  // ENVIRONMENT
  weather_forecasting_dataset: [
    { source: 'huggingface', id: 'openvax/weather' }
  ],
  air_quality_index_prediction: [
    { source: 'huggingface', id: 'dheeraj765/air-quality-index-delhi' }
  ],

  // ENERGY
  energy_consumption_prediction: [
    { source: 'kaggle', slug: 'deepanshu291/time-series-household-electric-power-consumption' }
  ],
  predictive_maintenance_dataset: [
    { source: 'kaggle', slug: 'deepanshu291/predictive-maintenance-dataset' }
  ],

  // NEW ADDITIONS - additional sources
  health_insurance_risk: [
    { source: 'huggingface', id: 'vraman54/HealthInsuranceDataset' }
  ],
  hospital_readmission_prediction: [
    { source: 'huggingface', id: 'supersam7/hospital_readmission_rates_2020' }
  ],
  credit_score_prediction: [
    { source: 'huggingface', id: 'Hahad14/Credit_score' }
  ],
  financial_risk_assessment: [
    { source: 'huggingface', id: 'gretelai/gretel-financial-risk-analysis-v1' }
  ],
  sentiment_analysis_dataset: [
    { source: 'huggingface', id: 'sentimentlabelledteddyoscar/amazon-reviews-multi' }
  ],
  spam_email_detection: [
    { source: 'huggingface', id: 'lakshmi25n/email-spam-detection-dataset' }
  ],
  hate_speech_detection: [
    { source: 'huggingface', id: 'hateinpeace/hate_speech_roBERTa' }
  ],
  forex_rate_forecasting: [
    { source: 'huggingface', id: 'siddhu2502/Forex-1min-Dataset' }
  ],
  weather_forecasting_dataset: [
    { source: 'huggingface', id: 'openvax/weather' }
  ],
  air_quality_index_prediction: [
    { source: 'huggingface', id: 'dheeraj765/air-quality-index-delhi' }
  ],
  house_price_prediction: [
    { source: 'huggingface', id: 'scikit-learn/california_housing' }
  ],
  real_estate_value_prediction: [
    { source: 'huggingface', id: 'scikit-learn/california_housing' }
  ],

  // LEGACY
  heart_disease: [
    { source: 'uci', id: 'heart-disease', url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/cleveland.data' },
    { source: 'kaggle', slug: 'andrewmvd/heart-failure-clinical-data' },
    { source: 'huggingface', id: 'mstz/heart_failure' }
  ],
  diabetes: [
    { source: 'kaggle', slug: 'uciml/pima-indians-diabetes-database' },
    { source: 'huggingface', id: 'scikit-learn/diabetes' }
  ],
  breast_cancer: [
    { source: 'kaggle', slug: 'uciml/breast-cancer-wisconsin-data' },
    { source: 'huggingface', id: 'scikit-learn/breast_cancer' }
  ],
  customer_churn: [
    { source: 'kaggle', slug: 'blastchar/telco-customer-churn' }
  ],
  credit_card_fraud: [
    { source: 'kaggle', slug: 'mlg-ulb/creditcardfraud' }
  ],
  loan_default: [
    { source: 'kaggle', slug: 'laotse/credit-risk-dataset' }
  ],
  employee_attrition: [
    { source: 'kaggle', slug: 'pavansubhasht/ibm-hr-analytics-attrition-dataset' }
  ],
  student_performance: [
    { source: 'kaggle', slug: 'stripathy/main-student-performance' },
    { source: 'uci', id: 'student-performance' }
  ],
  liver_disease: [
    { source: 'kaggle', slug: 'uciml/indian-liver-patient-dataset' }
  ],
  iris: [
    { source: 'uci', id: 'iris', url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/iris/iris.data' },
    { source: 'huggingface', id: 'scikit-learn/iris' }
  ],
  wine: [
    { source: 'uci', id: 'wine', url: 'https://archive.ics.uci.edu/ml/machine-learning-databases/wine/wine.data' }
  ]
};

async function fetchWithFallback(topic, topicInfo, options = {}) {
  logger.info(`Attempting fallback fetch for: ${topic}`);
  
  const topicKey = topicInfo.topicKey;
  
  if (topicKey && KNOWN_PUBLIC_DATASETS[topicKey]) {
    const fallbacks = KNOWN_PUBLIC_DATASETS[topicKey];
    
    for (const fallback of fallbacks) {
      try {
        const result = await tryFallbackSource(fallback, options);
        if (result && result.rows && result.rows.length > 0) {
          return {
            ...result,
            method: 'fallback',
            fallbackSource: fallback.source
          };
        }
      } catch (error) {
        logger.warn(`Fallback ${fallback.source} failed: ${error.message}`);
      }
    }
  }
  
  return generateSyntheticData(topic, topicInfo, options);
}

async function tryFallbackSource(source, options = {}) {
  if (source.source === 'huggingface') {
    const hf = require('../sources/huggingface');
    return await hf.fetch(source.id || source.slug, options);
  }
  
  if (source.source === 'kaggle') {
    const kaggle = require('../sources/kaggle');
    return await kaggle.fetch(source.slug, options);
  }
  
  if (source.url) {
    const axios = require('axios');
    try {
      const response = await axios.get(source.url, { timeout: 30000 });
      const lines = response.data.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',');
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((h, i) => {
          row[h.trim()] = values[i]?.trim() || null;
        });
        return row;
      });
      return { rows, source: source.source };
    } catch (error) {
      throw new Error(`Failed to fetch from URL: ${error.message}`);
    }
  }
  
  return null;
}

function generateSyntheticData(topic, topicInfo, options = {}) {
  const size = options.size || 100;
  const domainFamily = topicInfo.domainFamily || 'unknown';
  
  // Try topic-specific blueprint first
  let bp = null;
  if (topicInfo.topicKey) {
    bp = getDomainBlueprint(topicInfo.topicKey);
  }
  
  // Fall back to domain blueprint
  if (!bp && DOMAIN_BLUEPRINTS[domainFamily]) {
    const domainKeys = Object.keys(DOMAIN_BLUEPRINTS[domainFamily]);
    if (domainKeys.length > 0) {
      bp = DOMAIN_BLUEPRINTS[domainFamily][domainKeys[0]];
    }
  }
  
  if (bp) {
    logger.info(`Generating synthetic data using domain blueprint for: ${topic} (${domainFamily})`);
    
    const rows = [];
    const idField = bp.idField;
    const targetField = bp.target;
    
    for (let i = 0; i < size; i++) {
      const row = generateDomainRow(bp, i);
      rows.push(row);
    }
    
    return {
      rows,
      schema: {
        columns: bp.columns,
        targetColumn: targetField,
        idField: idField
      },
      method: 'synthetic',
      domainFamily: domainFamily,
      source: 'domain_blueprint'
    };
  }
  
  logger.warn(`No blueprint found for: ${topic}. No synthetic data can be generated.`);
  
  return {
    rows: [],
    schema: { columns: [], rowCount: 0 },
    method: 'no_blueprint',
    notice: {
      message: `Domain blueprint not available for "${topic}"`,
      suggestion: 'Try one of these supported topics: ' + Object.keys(KNOWN_PUBLIC_DATASETS).join(', '),
      domainFamily: topicInfo.domainFamily || 'unknown'
    },
    source: 'fallback'
  };
}

function listAvailableTopics() {
  return Object.entries(KNOWN_PUBLIC_DATASETS).map(([key, sources]) => ({
    topic: key,
    sources: sources.map(s => s.source),
    hasKaggle: sources.some(s => s.source === 'kaggle'),
    hasUCI: sources.some(s => s.source === 'uci'),
    hasHuggingFace: sources.some(s => s.source === 'huggingface')
  }));
}

module.exports = { 
  fetchWithFallback, 
  tryFallbackSource, 
  generateSyntheticData, 
  listAvailableTopics, 
  KNOWN_PUBLIC_DATASETS 
};
