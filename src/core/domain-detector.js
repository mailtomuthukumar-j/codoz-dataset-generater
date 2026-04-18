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
  // MEDICAL DOMAIN - 20 topics
  heart_disease_prediction: {
    domainFamily: 'medical',
    kaggleSlugs: ['andrewmvd/heart-failure-clinical-data', 'fedesoriano/heart-failure-prediction'],
    uciIds: ['heart-disease'],
    huggingfaceIds: ['mstz/heart_failure'],
    searchTerms: ['heart disease failure prediction clinical']
  },
  diabetes_prediction: {
    domainFamily: 'medical',
    kaggleSlugs: ['uciml/pima-indians-diabetes-database'],
    uciIds: ['pima-indians-diabetes'],
    huggingfaceIds: ['scikit-learn/diabetes'],
    searchTerms: ['diabetes pima indian clinical']
  },
  breast_cancer_detection: {
    domainFamily: 'medical',
    kaggleSlugs: ['merishnasuwal/breast-cancer-prediction-dataset', 'uciml/breast-cancer-wisconsin-data'],
    uciIds: ['breast-cancer-wisconsin'],
    huggingfaceIds: ['scikit-learn/breast_cancer'],
    searchTerms: ['breast cancer wisconsin diagnosis']
  },
  lung_cancer_prediction: {
    domainFamily: 'medical',
    kaggleSlugs: ['deepanshu291/lung-cancer-dataset', 'yasserhussein/lung-cancer-dataset'],
    uciIds: [],
    huggingfaceIds: ['nateraw/lung-cancer'],
    searchTerms: ['lung cancer']
  },
  kidney_disease_classification: {
    domainFamily: 'medical',
    kaggleSlugs: ['marfedah/ckd-dataset', 'tamil变压器/chronic-kidney-disease'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['chronic kidney disease ckd']
  },
  liver_disease_prediction: {
    domainFamily: 'medical',
    kaggleSlugs: ['uciml/indian-liver-patient-dataset'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['liver disease hepatitis']
  },
  stroke_risk_prediction: {
    domainFamily: 'medical',
    kaggleSlugs: ['godsoncrazyx/stroke-prediction-dataset'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['stroke risk prediction']
  },
  brain_tumor_detection: {
    domainFamily: 'medical',
    kaggleSlugs: ['ahmedmohamed600/brain-tumor-dataset', 'sartajbhuvaji/brain-tumor-classification'],
    uciIds: [],
    huggingfaceIds: ['Gaborandi/Brain_Tumor_pubmed_abstracts'],
    searchTerms: ['brain tumor']
  },
  covid19_risk_analysis: {
    domainFamily: 'medical',
    kaggleSlugs: ['saurabh225covid19/covid19-coronavirus-dataset'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['covid19 coronavirus']
  },
  medical_diagnosis_system: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['medical diagnosis clinical']
  },
  patient_survival_prediction: {
    domainFamily: 'medical',
    kaggleSlugs: ['andrewmvd/heart-failure-clinical-data'],
    uciIds: ['heart-disease'],
    huggingfaceIds: [],
    searchTerms: ['survival prediction patient']
  },
  hospital_readmission_prediction: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['hospital readmission']
  },
  drug_effectiveness_analysis: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['drug effectiveness clinical']
  },
  genomic_sequence_classification: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: ['simecek/Human_DNA_v0'],
    searchTerms: ['dna sequence']
  },
  protein_structure_prediction: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['protein structure fold']
  },
  dna_mutation_analysis: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: ['davidcechak/Human_DNA_v0'],
    searchTerms: ['dna mutation']
  },
  blood_test_anomaly_detection: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['blood test anomaly laboratory']
  },
  health_insurance_risk: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['health insurance risk']
  },
  medical_image_classification: {
    domainFamily: 'medical',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['medical image classification']
  },
  xray_pneumonia_detection: {
    domainFamily: 'medical',
    kaggleSlugs: ['paultimothymooney/chest-xray-pneumonia'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['chest xray pneumonia']
  },

  // FINANCIAL DOMAIN - 15 topics
  stock_market_prediction: {
    domainFamily: 'financial',
    kaggleSlugs: ['ramrajrajpal/nyse-stock-data'],
    uciIds: [],
    huggingfaceIds: ['rajaharyard/nyse-stock-data'],
    searchTerms: ['nyse stock market']
  },
  crypto_price_prediction: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: ['arthurneuron/cryptocurrency-futures-ohlcv-dataset-1m'],
    searchTerms: ['cryptocurrency bitcoin price']
  },
  forex_rate_forecasting: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['forex exchange rate']
  },
  algorithmic_trading_signals: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['algorithmic trading signals']
  },
  high_frequency_trading_data: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['high frequency trading']
  },
  bank_loan_approval: {
    domainFamily: 'financial',
    kaggleSlugs: ['laotse/credit-risk-dataset'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['loan approval credit risk']
  },
  credit_score_prediction: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['credit score prediction']
  },
  credit_card_fraud_detection: {
    domainFamily: 'financial',
    kaggleSlugs: ['mlg-ulb/creditcardfraud', 'nelgiriyewithana/credit-card-fraud-detection'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['credit card fraud detection']
  },
  financial_risk_assessment: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['financial risk assessment']
  },
  insurance_claim_fraud: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['insurance claim fraud']
  },
  customer_churn_prediction: {
    domainFamily: 'ecommerce',
    kaggleSlugs: ['blastchar/telco-customer-churn', 'binuthomas/telco-customer-churn-prediction'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['telecom customer churn']
  },
  customer_lifetime_value: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['customer lifetime value']
  },
  sales_forecasting: {
    domainFamily: 'ecommerce',
    kaggleSlugs: ['utkarshthaker/store-item-demand-forecasting'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['sales demand forecasting']
  },
  product_demand_prediction: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['product demand prediction']
  },
  ecommerce_recommendation: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['ecommerce recommendation']
  },
  user_purchase_behavior: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['user purchase behavior']
  },
  marketing_campaign_effectiveness: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['marketing campaign']
  },
  ad_click_prediction: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['ad click prediction']
  },
  social_media_ad_targeting: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['social media advertising']
  },
  price_optimization_engine: {
    domainFamily: 'ecommerce',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['price optimization']
  },

  // REAL ESTATE - 8 topics
  house_price_prediction: {
    domainFamily: 'financial',
    kaggleSlugs: ['muthukrishnan002/house-price-prediction-uci-dataset'],
    uciIds: [],
    huggingfaceIds: ['scikit-learn/california_housing'],
    searchTerms: ['house price california']
  },
  real_estate_value_prediction: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['real estate value']
  },
  rental_price_estimation: {
    domainFamily: 'financial',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['rental price house']
  },
  urban_development_analysis: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['urban development']
  },
  smart_city_traffic_prediction: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['smart city traffic']
  },
  traffic_congestion_prediction: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['traffic congestion']
  },
  accident_hotspot_detection: {
    domainFamily: 'transport',
    kaggleSlugs: ['usmanrazaTraffic/road-traffic-accidents'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['traffic accident hotspot']
  },
  route_optimization_system: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['route optimization']
  },
  vehicle_detection_traffic_cam: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['vehicle detection traffic']
  },
  autonomous_driving_dataset: {
    domainFamily: 'transport',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['autonomous driving']
  },

  // COMPUTER VISION - 15 topics
  image_classification_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['image classification']
  },
  object_detection_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['object detection']
  },
  facial_recognition_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['face recognition']
  },
  emotion_detection_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['emotion detection']
  },
  pose_estimation_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['pose estimation']
  },
  handwriting_recognition: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['handwriting recognition']
  },
  document_classification: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['document classification']
  },
  ocr_text_recognition: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['ocr text recognition']
  },
  image_captioning_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['image captioning']
  },
  video_action_recognition: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['video action recognition']
  },
  speech_to_text_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['speech to text']
  },
  text_to_speech_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['text to speech']
  },
  language_translation_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['language translation']
  },
  sentiment_analysis_dataset: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['sentiment analysis']
  },
  chatbot_conversation_data: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['chatbot conversation']
  },
  question_answering_dataset: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['question answering']
  },
  text_summarization_dataset: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['text summarization']
  },
  fake_news_detection: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: ['clic02/fake-news', 'raj89323/fake_news_detection'],
    uciIds: [],
    huggingfaceIds: ['mteb/fake-news'],
    searchTerms: ['fake news detection']
  },
  spam_email_detection: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['spam email detection']
  },
  hate_speech_detection: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['hate speech detection']
  },
  toxic_comment_classification: {
    domainFamily: 'nlp_classification',
    kaggleSlugs: ['google poison-dan', 'chatgpt-supported-hate-speech'],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['toxic comment classification']
  },

  // SOFTWARE/DEV - 7 topics
  code_generation_dataset: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['code generation']
  },
  code_bug_detection: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['code bug detection']
  },
  software_defect_prediction: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['software defect']
  },
  devops_log_analysis: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['devops log']
  },
  cybersecurity_attack_logs: {
    domainFamily: 'cybersecurity',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['cybersecurity attack']
  },
  malware_detection_dataset: {
    domainFamily: 'cybersecurity',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['malware detection']
  },
  phishing_detection_dataset: {
    domainFamily: 'cybersecurity',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['phishing detection']
  },
  network_intrusion_detection: {
    domainFamily: 'cybersecurity',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['network intrusion']
  },
  system_anomaly_detection: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['system anomaly']
  },

  // ENVIRONMENTAL - 8 topics
  weather_forecasting_dataset: {
    domainFamily: 'weather',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: ['openvax/weather'],
    searchTerms: ['weather forecast']
  },
  climate_change_prediction: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['climate change']
  },
  air_quality_index_prediction: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: ['dheeraj765/air-quality-index-delhi'],
    searchTerms: ['air quality delhi']
  },
  pollution_detection_dataset: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['pollution detection']
  },
  earthquake_prediction_dataset: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['earthquake']
  },
  flood_prediction_system: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['flood prediction']
  },
  wildfire_risk_analysis: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['wildfire risk']
  },
  agriculture_crop_yield_prediction: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['crop yield prediction']
  },
  soil_quality_analysis: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['soil quality']
  },
  plant_disease_detection: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['plant disease detection']
  },
  satellite_image_analysis: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['satellite image']
  },
  remote_sensing_earth_data: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['remote sensing']
  },
  ocean_temperature_analysis: {
    domainFamily: 'environment',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['ocean temperature']
  },

  // ENERGY - 5 topics
  energy_consumption_prediction: {
    domainFamily: 'energy',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['energy consumption']
  },
  smart_grid_load_prediction: {
    domainFamily: 'energy',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['smart grid load']
  },
  electricity_price_forecasting: {
    domainFamily: 'energy',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['electricity price']
  },
  industrial_machine_failure_prediction: {
    domainFamily: 'energy',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['machine failure prediction']
  },
  predictive_maintenance_dataset: {
    domainFamily: 'energy',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['predictive maintenance']
  },

  // ACTIVITY/IOT - 3 topics
  human_activity_recognition: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['human activity recognition']
  },
  iot_sensor_anomaly_detection: {
    domainFamily: 'general',
    kaggleSlugs: [],
    uciIds: [],
    huggingfaceIds: [],
    searchTerms: ['iot sensor anomaly']
  },

  // LEGACY MAPPINGS (for backward compatibility)
  heart_disease: { domainFamily: 'medical', kaggleSlugs: ['andrewmvd/heart-failure-clinical-data'], uciIds: ['heart-disease'], huggingfaceIds: ['mstz/heart_failure'], searchTerms: ['heart disease'] },
  diabetes: { domainFamily: 'medical', kaggleSlugs: ['uciml/pima-indians-diabetes-database'], uciIds: ['pima-indians-diabetes'], huggingfaceIds: ['scikit-learn/diabetes'], searchTerms: ['diabetes'] },
  breast_cancer: { domainFamily: 'medical', kaggleSlugs: ['merishnasuwal/breast-cancer-prediction-dataset'], uciIds: ['breast-cancer-wisconsin'], huggingfaceIds: ['scikit-learn/breast_cancer'], searchTerms: ['breast cancer'] },
  iris_flower: { domainFamily: 'general', kaggleSlugs: [], uciIds: ['iris'], huggingfaceIds: ['scikit-learn/iris'], searchTerms: ['iris flower'] },
  iris: { domainFamily: 'general', kaggleSlugs: [], uciIds: ['iris'], huggingfaceIds: ['scikit-learn/iris'], searchTerms: ['iris'] },
  wine_quality: { domainFamily: 'general', kaggleSlugs: [], uciIds: ['wine'], huggingfaceIds: [], searchTerms: ['wine quality'] },
  wine: { domainFamily: 'general', kaggleSlugs: [], uciIds: ['wine'], huggingfaceIds: [], searchTerms: ['wine'] },
  student_performance: { domainFamily: 'education', kaggleSlugs: ['stripathy/main-student-performance'], uciIds: ['student-performance'], huggingfaceIds: [], searchTerms: ['student performance'] },
  stock_market_data: { domainFamily: 'financial', kaggleSlugs: ['ramrajrajpal/nyse-stock-data'], uciIds: [], huggingfaceIds: ['rajaharyard/nyse-stock-data'], searchTerms: ['stock market'] },
  stock: { domainFamily: 'financial', kaggleSlugs: ['ramrajrajpal/nyse-stock-data'], uciIds: [], huggingfaceIds: ['rajaharyard/nyse-stock-data'], searchTerms: ['stock'] },
  bank_loan: { domainFamily: 'financial', kaggleSlugs: ['laotse/credit-risk-dataset'], uciIds: [], huggingfaceIds: [], searchTerms: ['bank loan'] },
  bank_loan_approval: { domainFamily: 'financial', kaggleSlugs: ['laotse/credit-risk-dataset'], uciIds: [], huggingfaceIds: [], searchTerms: ['loan approval'] },
  credit_card_fraud: { domainFamily: 'financial', kaggleSlugs: ['mlg-ulb/creditcardfraud'], huggingfaceIds: [], searchTerms: ['fraud'] },
  customer_churn: { domainFamily: 'ecommerce', kaggleSlugs: ['blastchar/telco-customer-churn'], huggingfaceIds: [], searchTerms: ['churn'] },
  sales_forecasting: { domainFamily: 'ecommerce', kaggleSlugs: ['utkarshthaker/store-item-demand-forecasting'], uciIds: [], huggingfaceIds: [], searchTerms: ['sales'] },
  weather_prediction: { domainFamily: 'weather', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['openvax/weather'], searchTerms: ['weather'] },
  cryptocurrency_price: { domainFamily: 'financial', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['arthurneuron/cryptocurrency-futures-ohlcv-dataset-1m'], searchTerms: ['crypto'] },
  air_quality_index: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['dheeraj765/air-quality-index-delhi'], searchTerms: ['air quality'] },
  traffic_accident: { domainFamily: 'transport', kaggleSlugs: ['usmanrazaTraffic/road-traffic-accidents'], uciIds: [], huggingfaceIds: [], searchTerms: ['traffic'] },
  mobile_price: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['mobile price'] },
  mobile_price_classification: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['mobile price'] },
  loan_default_risk: { domainFamily: 'financial', kaggleSlugs: ['laotse/credit-risk-dataset'], uciIds: [], huggingfaceIds: [], searchTerms: ['loan default'] },
  ecommerce_customer_behavior: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['ecommerce'] },
  
  // NEW ADDITIONS - Adding sources for topics without data
  health_insurance_risk: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['vraman54/HealthInsuranceDataset'], searchTerms: ['health insurance'] },
  hospital_readmission_prediction: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['supersam7/hospital_readmission_rates_2020'], searchTerms: ['hospital readmission'] },
  medical_image_classification: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['submitting/Medical_images'], searchTerms: ['medical image'] },
  blood_test_anomaly_detection: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['ClarusC64/clinical-blood-test-order-collection-coherence-risk-v0.1'], searchTerms: ['blood test'] },
  credit_score_prediction: { domainFamily: 'financial', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['Hahad14/Credit_score'], searchTerms: ['credit score'] },
  financial_risk_assessment: { domainFamily: 'financial', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['gretelai/gretel-financial-risk-analysis-v1'], searchTerms: ['financial risk'] },
  insurance_claim_fraud: { domainFamily: 'financial', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['rhesis/Insurance-Chatbot-Agent-or-Industry-Fraud-Harmful'], searchTerms: ['insurance fraud'] },
  drug_effectiveness_analysis: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['eve-bio/drug-target-activity'], searchTerms: ['drug'] },
  protein_structure_prediction: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['OATML-Markslab/ProteinGym'], searchTerms: ['protein'] },
  genomic_sequence_classification: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['katarinagresova/Genomic_Benchmarks_dummy_mouse_enhancers_ensembl'], searchTerms: ['genomic'] },
  forex_rate_forecasting: { domainFamily: 'financial', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['siddhu2502/Forex-1min-Dataset'], searchTerms: ['forex'] },
  customer_lifetime_value: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['clv'] },
  product_demand_prediction: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['demand'] },
  ecommerce_recommendation: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['recommendation'] },
  user_purchase_behavior: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['purchase'] },
  sentiment_analysis_dataset: { domainFamily: 'nlp_classification', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['sentimentlabelledteddyoscar/amazon-reviews-multi'], searchTerms: ['sentiment'] },
  spam_email_detection: { domainFamily: 'nlp_classification', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['lakshmi25n/email-spam-detection-dataset'], searchTerms: ['spam'] },
  hate_speech_detection: { domainFamily: 'nlp_classification', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['hateinpeace/hate_speech_roBERTa'], searchTerms: ['hate'] },
  weather_forecasting_dataset: { domainFamily: 'weather', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['openvax/weather'], searchTerms: ['weather'] },
  climate_change_prediction: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['climate'] },
  energy_consumption_prediction: { domainFamily: 'energy', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['energy'] },
  predictive_maintenance_dataset: { domainFamily: 'energy', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['maintenance'] },
  medical_diagnosis_system: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['mstz/heart_failure'], searchTerms: ['diagnosis'] },
  sales_forecasting: { domainFamily: 'ecommerce', kaggleSlugs: ['utkarshthaker/store-item-demand-forecasting'], uciIds: [], huggingfaceIds: [], searchTerms: ['sales'] },
  ad_click_prediction: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['click'] },
  marketing_campaign_effectiveness: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['campaign'] },
  price_optimization_engine: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['price'] },
  traffic_congestion_prediction: { domainFamily: 'transport', kaggleSlugs: ['usmanrazaTraffic/road-traffic-accidents'], uciIds: [], huggingfaceIds: [], searchTerms: ['traffic'] },
  accident_hotspot_detection: { domainFamily: 'transport', kaggleSlugs: ['usmanrazaTraffic/road-traffic-accidents'], uciIds: [], huggingfaceIds: [], searchTerms: ['accident'] },
  house_price_prediction: { domainFamily: 'financial', kaggleSlugs: ['muthukrishnan002/house-price-prediction-uci-dataset'], uciIds: [], huggingfaceIds: ['scikit-learn/california_housing'], searchTerms: ['house'] },
  real_estate_value_prediction: { domainFamily: 'financial', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['scikit-learn/california_housing'], searchTerms: ['estate'] },
  rental_price_estimation: { domainFamily: 'financial', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['rental'] },
  urban_development_analysis: { domainFamily: 'transport', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['urban'] },
  smart_city_traffic_prediction: { domainFamily: 'transport', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['smart city'] },
  route_optimization_system: { domainFamily: 'transport', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['route'] },
  vehicle_detection_traffic_cam: { domainFamily: 'transport', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['vehicle'] },
  autonomous_driving_dataset: { domainFamily: 'transport', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['driving'] },
  image_classification_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['image'] },
  object_detection_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['object'] },
  facial_recognition_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['face'] },
  emotion_detection_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['emotion'] },
  pose_estimation_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['pose'] },
  handwriting_recognition: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['handwriting'] },
  document_classification: { domainFamily: 'nlp_classification', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['document'] },
  ocr_text_recognition: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['ocr'] },
  image_captioning_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['caption'] },
  video_action_recognition: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['video'] },
  speech_to_text_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['speech'] },
  text_to_speech_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['speech'] },
  language_translation_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['translation'] },
  chatbot_conversation_data: { domainFamily: 'nlp_classification', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['chatbot'] },
  question_answering_dataset: { domainFamily: 'nlp_classification', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['qa'] },
  text_summarization_dataset: { domainFamily: 'nlp_classification', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['summary'] },
  toxic_comment_classification: { domainFamily: 'nlp_classification', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['toxic'] },
  code_generation_dataset: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['code'] },
  code_bug_detection: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['bug'] },
  software_defect_prediction: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['defect'] },
  devops_log_analysis: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['log'] },
  cybersecurity_attack_logs: { domainFamily: 'cybersecurity', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['attack'] },
  malware_detection_dataset: { domainFamily: 'cybersecurity', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['malware'] },
  phishing_detection_dataset: { domainFamily: 'cybersecurity', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['phishing'] },
  network_intrusion_detection: { domainFamily: 'cybersecurity', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['intrusion'] },
  system_anomaly_detection: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['anomaly'] },
  air_quality_index_prediction: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: ['dheeraj765/air-quality-index-delhi'], searchTerms: ['air quality'] },
  pollution_detection_dataset: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['pollution'] },
  earthquake_prediction_dataset: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['earthquake'] },
  flood_prediction_system: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['flood'] },
  wildfire_risk_analysis: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['wildfire'] },
  agriculture_crop_yield_prediction: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['crop'] },
  soil_quality_analysis: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['soil'] },
  plant_disease_detection: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['plant'] },
  satellite_image_analysis: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['satellite'] },
  remote_sensing_earth_data: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['remote'] },
  ocean_temperature_analysis: { domainFamily: 'environment', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['ocean'] },
  smart_grid_load_prediction: { domainFamily: 'energy', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['grid'] },
  electricity_price_forecasting: { domainFamily: 'energy', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['electricity'] },
  industrial_machine_failure_prediction: { domainFamily: 'energy', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['machine'] },
  human_activity_recognition: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['activity'] },
  iot_sensor_anomaly_detection: { domainFamily: 'general', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['iot'] },
  social_media_ad_targeting: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['ad'] },
  patient_survival_prediction: { domainFamily: 'medical', kaggleSlugs: ['andrewmvd/heart-failure-clinical-data'], uciIds: [], huggingfaceIds: [], searchTerms: ['survival'] },
  xray_pneumonia_detection: { domainFamily: 'medical', kaggleSlugs: ['paultimothymooney/chest-xray-pneumonia'], uciIds: [], huggingfaceIds: [], searchTerms: ['pneumonia'] },
  brain_tumor_detection: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['tumor'] },
  covid19_risk_analysis: { domainFamily: 'medical', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['covid'] },
  mobile_price: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['mobile'] },
  mobile_price_classification: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['mobile'] },
  ecommerce_customer_behavior: { domainFamily: 'ecommerce', kaggleSlugs: [], uciIds: [], huggingfaceIds: [], searchTerms: ['ecommerce'] },
  customer_churn_prediction: { domainFamily: 'ecommerce', kaggleSlugs: ['blastchar/telco-customer-churn'], uciIds: [], huggingfaceIds: [], searchTerms: ['churn'] }
};

function detectDomain(topic) {
  const normalizedTopic = topic.toLowerCase().trim();
  const normalizedWithSpace = normalizedTopic.replace(/_/g, ' ');
  const normalizedWithUnderscore = normalizedTopic.replace(/ /g, '_');
  
  // First try exact match with various transformations
  let topicKey = Object.keys(TOPIC_MAPPINGS).find(key => 
    key === normalizedTopic ||
    key === normalizedWithUnderscore ||
    key === normalizedWithSpace ||
    normalizedTopic.replace(/prediction|analysis|forecast|detection|classification|risk|system/gi, '').trim() === key ||
    normalizedTopic.includes(key) ||
    key.includes(normalizedTopic)
  );
  
  // Also try partial matching - extract main keywords
  if (!topicKey) {
    const mainWords = normalizedTopic
      .replace(/(?:prediction|analysis|forecast|detection|classification|risk|system|dataset)/gi, '')
      .replace(/s$/, '')
      .trim();
    
    if (mainWords && mainWords.length > 2) {
      topicKey = Object.keys(TOPIC_MAPPINGS).find(key => 
        key.includes(mainWords) || mainWords.includes(key)
      );
    }
  }
  
  if (topicKey && TOPIC_MAPPINGS[topicKey]) {
    return {
      domainFamily: TOPIC_MAPPINGS[topicKey].domainFamily,
      topicKey,
      mappings: TOPIC_MAPPINGS[topicKey],
      hasBlueprint: true
    };
  }
  
  // Fallback to keyword-based detection
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
