/**
 * CODOZ Topic Intelligence Agent
 * 
 * Deep topic analysis that:
 * 1. Captures the topic
 * 2. Matches to knowledge base
 * 3. Extracts semantic understanding
 * 4. Prepares information for dataset construction
 */

const { matchTopic, KNOWLEDGE_BASE, getAllTopics } = require('../core/knowledge_base');

function process(context) {
  const topic = context.topic;
  
  if (!topic || topic.trim().length === 0) {
    return {
      ...context,
      error: 'Topic is required',
      logs: [...context.logs, createLog('error', 'Topic is required')]
    };
  }
  
  console.log('━'.repeat(60));
  console.log('PHASE 1: TOPIC INTELLIGENCE');
  console.log('━'.repeat(60));
  console.log(`\nCapturing topic: "${topic}"`);
  
  // Step 1: Deep topic analysis
  const analysis = analyzeTopic(topic);
  console.log(`\nAnalyzing topic components...`);
  console.log(`  - Primary entity: ${analysis.entity}`);
  console.log(`  - Context: ${analysis.context}`);
  console.log(`  - Intent: ${analysis.intent}`);
  
  // Step 2: Match to knowledge base
  const match = matchTopicToKnowledgeBase(topic);
  
  if (match) {
    console.log(`\nKnowledge base match found!`);
    console.log(`  - Matched topic: ${match.config.name}`);
    console.log(`  - Confidence: ${(match.confidence * 100).toFixed(0)}}%`);
    console.log(`  - Entity: ${match.config.entity}`);
    console.log(`  - Description: ${match.config.description}`);
    
    // Step 3: Build comprehensive understanding
    const understanding = buildDeepUnderstanding(topic, analysis, match);
    
    console.log(`\nBuilding understanding...`);
    console.log(`  - Target variable: ${understanding.target.name}`);
    console.log(`  - Target type: ${understanding.target.type}`);
    console.log(`  - Target values: ${understanding.target.values.join(', ')}`);
    console.log(`  - Feature categories: ${Object.keys(understanding.features).length}`);
    console.log(`  - Causal rules: ${understanding.causalRules.length}`);
    
    // Step 4: Generate information requirements
    const infoGathering = prepareInformationGathering(understanding);
    
    return {
      ...context,
      topicAnalysis: understanding,
      knowledgeBaseMatch: match,
      informationGathering: infoGathering,
      entity: match.config.entity,
      context: match.config.context,
      target: understanding.target,
      features: understanding.features,
      causalRules: understanding.causalRules,
      logs: [...context.logs, createLog('topic_intelligence_complete', {
        topic: match.config.name,
        entity: match.config.entity,
        target: understanding.target.name,
        featureCount: understanding.totalFeatures,
        confidence: match.confidence
      })]
    };
  } else {
    // Handle unknown topic - generate reasonable schema
    console.log(`\nNo exact match found. Generating custom schema...`);
    const customUnderstanding = generateCustomSchema(topic, analysis);
    
    return {
      ...context,
      topicAnalysis: customUnderstanding,
      knowledgeBaseMatch: null,
      informationGathering: null,
      entity: analysis.entity,
      context: analysis.context,
      target: customUnderstanding.target,
      features: customUnderstanding.features,
      causalRules: customUnderstanding.causalRules,
      logs: [...context.logs, createLog('topic_intelligence_complete', {
        topic: 'custom',
        entity: analysis.entity,
        target: customUnderstanding.target.name,
        featureCount: customUnderstanding.totalFeatures,
        confidence: 0.5
      })]
    };
  }
}

function analyzeTopic(topic) {
  const normalized = topic.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  
  // Extract entity (what is being studied)
  const entity = inferEntity(words);
  
  // Extract context (where/when)
  const context = inferContext(words);
  
  // Extract intent (what action/prediction)
  const intent = inferIntent(normalized);
  
  // Extract modifiers (binary, multi-class, regression)
  const modifiers = extractModifiers(normalized);
  
  return {
    raw: topic,
    normalized,
    words,
    entity,
    context,
    intent,
    modifiers,
    domain: inferDomain(words)
  };
}

function inferEntity(words) {
  const entityPatterns = {
    patient: ['patient', 'person', 'individual', 'customer', 'client', 'user'],
    student: ['student', 'learner', 'scholar'],
    employee: ['employee', 'worker', 'staff', 'personnel'],
    transaction: ['transaction', 'purchase', 'order', 'payment'],
    machine: ['machine', 'equipment', 'device', 'sensor', 'machine'],
    customer: ['customer', 'client', 'subscriber', 'user'],
    record: ['record', 'case', 'observation', 'entry'],
    sample: ['sample', 'specimen', 'measurement']
  };
  
  for (const [entity, patterns] of Object.entries(entityPatterns)) {
    for (const word of words) {
      if (patterns.includes(word)) {
        return entity;
      }
    }
  }
  
  return 'record';
}

function inferContext(words) {
  const contextPatterns = {
    medical: ['hospital', 'clinic', 'diagnosis', 'treatment', 'health', 'clinical'],
    financial: ['bank', 'credit', 'loan', 'fraud', 'transaction', 'payment'],
    retail: ['store', 'shop', 'purchase', 'customer', 'inventory'],
    educational: ['school', 'university', 'college', 'student', 'course', 'grade'],
    industrial: ['factory', 'manufacturing', 'machine', 'production', 'maintenance'],
    environmental: ['sensor', 'monitoring', 'air', 'water', 'climate'],
    hr: ['employee', 'hr', 'workforce', 'attrition', 'performance']
  };
  
  for (const [context, patterns] of Object.entries(contextPatterns)) {
    for (const word of words) {
      if (patterns.includes(word)) {
        return context;
      }
    }
  }
  
  return 'general';
}

function inferIntent(normalized) {
  if (normalized.includes('predict') || normalized.includes('prediction')) {
    return 'prediction';
  }
  if (normalized.includes('detect') || normalized.includes('detection')) {
    return 'detection';
  }
  if (normalized.includes('classify') || normalized.includes('classification')) {
    return 'classification';
  }
  if (normalized.includes('segment') || normalized.includes('clustering')) {
    return 'segmentation';
  }
  if (normalized.includes('analyze') || normalized.includes('analysis')) {
    return 'analysis';
  }
  if (normalized.includes('monitor') || normalized.includes('monitoring')) {
    return 'monitoring';
  }
  return 'classification';
}

function extractModifiers(normalized) {
  const modifiers = [];
  
  if (normalized.includes('binary')) {
    modifiers.push('binary');
  }
  if (normalized.includes('multi-class') || normalized.includes('multiclass')) {
    modifiers.push('multi-class');
  }
  if (normalized.includes('regression') || normalized.includes('continuous')) {
    modifiers.push('regression');
  }
  if (normalized.includes('time series') || normalized.includes('temporal')) {
    modifiers.push('temporal');
  }
  if (normalized.includes('imbalanced')) {
    modifiers.push('imbalanced');
  }
  
  return modifiers;
}

function inferDomain(words) {
  const domainIndicators = {
    medical: ['medical', 'health', 'patient', 'diagnosis', 'disease', 'clinical', 'hospital', 'doctor'],
    financial: ['credit', 'loan', 'fraud', 'bank', 'payment', 'transaction', 'insurance'],
    retail: ['customer', 'purchase', 'sale', 'product', 'inventory', 'store'],
    educational: ['student', 'school', 'university', 'grade', 'academic', 'education'],
    industrial: ['machine', 'manufacturing', 'equipment', 'maintenance', 'factory'],
    environmental: ['sensor', 'environment', 'climate', 'air', 'water', 'pollution'],
    hr: ['employee', 'hr', 'workforce', 'attrition', 'hiring']
  };
  
  const scores = {};
  
  for (const [domain, indicators] of Object.entries(domainIndicators)) {
    scores[domain] = 0;
    for (const word of words) {
      if (indicators.includes(word)) {
        scores[domain]++;
      }
    }
  }
  
  const maxDomain = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return maxDomain[1] > 0 ? maxDomain[0] : 'general';
}

function matchTopicToKnowledgeBase(topic) {
  const match = matchTopic(topic);
  
  if (match && match.confidence >= 0.3) {
    return match;
  }
  
  return null;
}

function buildDeepUnderstanding(topic, analysis, match) {
  const config = match.config;
  
  // Build target variable
  const target = {
    name: config.target.name,
    type: config.target.type,
    values: config.target.values,
    positiveLabel: config.target.positive_label,
    description: getTargetDescription(config.target)
  };
  
  // Build features grouped by category
  const features = {};
  let totalFeatures = 0;
  
  for (const [category, featureList] of Object.entries(config.features)) {
    features[category] = featureList.map(f => ({
      ...f,
      isCritical: f.critical || false,
      hasConditional: f.conditional || null
    }));
    totalFeatures += featureList.length;
  }
  
  // Build causal rules
  const causalRules = config.causal_rules.map(rule => ({
    ...rule,
    type: rule.target_value ? 'target_rule' : 'correlation'
  }));
  
  return {
    topic: config.name,
    description: config.description,
    entity: config.entity,
    context: config.context,
    target,
    features,
    totalFeatures,
    causalRules,
    classDistribution: config.statistics.class_distribution,
    matchConfidence: match.confidence
  };
}

function getTargetDescription(target) {
  if (target.clinical_definition) {
    const def = target.clinical_definition;
    if (def.positive) {
      return `Positive class defined as: ${def.positive}`;
    }
  }
  return `Predict ${target.values.join(' vs ')}`;
}

function generateCustomSchema(topic, analysis) {
  const topicLower = topic.toLowerCase();
  
  // Determine target based on intent
  let targetName = 'target';
  let targetType = 'binary_classification';
  let targetValues = ['Class_A', 'Class_B'];
  
  if (analysis.modifiers.includes('regression')) {
    targetType = 'regression';
    targetValues = [0, 100];
  } else if (analysis.modifiers.includes('multi-class')) {
    targetType = 'multi_class_classification';
    targetValues = ['Class_A', 'Class_B', 'Class_C'];
  }
  
  // Generate generic features based on entity
  const features = generateGenericFeatures(analysis.entity, analysis.context);
  
  return {
    topic: topic,
    description: `Custom dataset for: ${topic}`,
    entity: analysis.entity,
    context: analysis.context,
    target: {
      name: targetName,
      type: targetType,
      values: targetValues,
      description: 'Target variable to predict'
    },
    features,
    totalFeatures: Object.values(features).reduce((sum, arr) => sum + arr.length, 0),
    causalRules: [],
    classDistribution: { 'Class_A': 0.7, 'Class_B': 0.3 },
    matchConfidence: 0.5
  };
}

function generateGenericFeatures(entity, context) {
  const features = {
    identifiers: [
      { name: 'id', type: 'uuid', description: 'Unique identifier' }
    ],
    demographics: [
      { name: 'age', type: 'integer', range: [18, 80], unit: 'years' },
      { name: 'gender', type: 'categorical', categories: ['Male', 'Female'] }
    ],
    measurements: [
      { name: 'value_1', type: 'float', range: [0, 100], description: 'Primary measurement' },
      { name: 'value_2', type: 'float', range: [0, 100], description: 'Secondary measurement' },
      { name: 'score', type: 'float', range: [0, 100], description: 'Composite score' }
    ],
    categorical: [
      { name: 'category', type: 'categorical', categories: ['A', 'B', 'C', 'D'], description: 'Category classification' },
      { name: 'status', type: 'categorical', categories: ['Low', 'Medium', 'High'], description: 'Status level' }
    ]
  };
  
  return features;
}

function prepareInformationGathering(understanding) {
  return {
    requiredInformation: {
      datasetName: understanding.topic,
      entity: understanding.entity,
      context: understanding.context,
      targetVariable: understanding.target.name,
      targetType: understanding.target.type,
      expectedRows: 1000,
      featureCount: understanding.totalFeatures,
      causalRuleCount: understanding.causalRules.length
    },
    
    schemaRequirements: {
      mustInclude: understanding.features.demographics?.map(f => f.name) || [],
      critical: Object.values(understanding.features)
        .flat()
        .filter(f => f.critical)
        .map(f => f.name) || [],
      optional: Object.values(understanding.features)
        .flat()
        .filter(f => !f.critical)
        .map(f => f.name) || []
    },
    
    generationRules: {
      targetFirst: true,
      applyCausalRules: true,
      enforceThresholds: true,
      preserveCorrelations: true
    }
  };
}

function createLog(event, data) {
  return {
    timestamp: new Date().toISOString(),
    event,
    data
  };
}

module.exports = { process };
