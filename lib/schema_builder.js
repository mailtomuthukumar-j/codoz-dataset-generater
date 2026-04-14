const { getDomainFeatures } = require('./analyzer');

function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function build(topicAnalysis) {
  const { topic, topicWords, domain, matchedKeywords, taskType } = topicAnalysis;
  const features = getDomainFeatures(domain);
  
  const columns = [];
  const correlations = {};
  
  columns.push({
    name: generateIdColumn(topic),
    type: 'id',
    prefix: generateIdPrefix(topic)
  });
  
  const demographicCount = Math.floor(seededRandom(hashString(topic)) * 2) + 2;
  for (let i = 0; i < demographicCount; i++) {
    const col = generateDemographicColumn(features, i, topic);
    if (col && !columns.find(c => c.name === col.name)) {
      columns.push(col);
    }
  }
  
  const numericCount = Math.floor(seededRandom(hashString(topic + 'numeric')) * 4) + 3;
  for (let i = 0; i < numericCount; i++) {
    const col = generateNumericColumn(features, topic, i);
    if (col && !columns.find(c => c.name === col.name)) {
      columns.push(col);
      if (columns.length > 2 && Math.random() > 0.5) {
        const existingCol = columns[columns.length - 2];
        if (!correlations[existingCol.name]) {
          correlations[existingCol.name] = [];
        }
        correlations[existingCol.name].push(col.name);
      }
    }
  }
  
  const categoricalCount = Math.floor(seededRandom(hashString(topic + 'cat')) * 3) + 2;
  for (let i = 0; i < categoricalCount; i++) {
    const col = generateCategoricalColumn(features, topic, i);
    if (col && !columns.find(c => c.name === col.name)) {
      columns.push(col);
    }
  }
  
  columns.push(generateOutcomeColumn(features, taskType));
  
  return {
    name: topic.replace(/\s+/g, '_').toLowerCase(),
    domain,
    columns,
    correlations,
    taskType,
    topic,
    generatedAt: new Date().toISOString()
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateIdColumn(topic) {
  const topicClean = topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words = topicClean.split(/\s+/);
  
  if (words.length >= 2) {
    return `${words[0].substring(0, 3)}${words[1].substring(0, 3)}_id`;
  }
  return `${words[0].substring(0, 6)}_id`;
}

function generateIdPrefix(topic) {
  const topicClean = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
  return topicClean.substring(0, 4).toUpperCase();
}

function generateDemographicColumn(features, index, topic) {
  const seed = hashString(topic + 'demo' + index);
  const rand = () => seededRandom(seed + index * 100);
  
  const options = [
    { name: 'gender', type: 'categorical', values: ['Male', 'Female'], weights: [0.5, 0.5] },
    { name: 'age', type: 'integer', range: [18, 80], distribution: 'normal' },
    { name: 'location', type: 'categorical', values: generateLocations(3 + Math.floor(rand() * 5), seed), weights: null },
    { name: 'marital_status', type: 'categorical', values: ['Single', 'Married', 'Divorced', 'Widowed'], weights: [0.3, 0.45, 0.2, 0.05] },
    { name: 'education_level', type: 'categorical', values: ['High School', 'Bachelor', 'Master', 'PhD'], weights: [0.35, 0.4, 0.2, 0.05] },
    { name: 'employment_status', type: 'categorical', values: ['Employed', 'Self-employed', 'Unemployed', 'Student'], weights: [0.5, 0.2, 0.2, 0.1] }
  ];
  
  const idx = Math.floor(rand() * options.length) % options.length;
  return options[(index + idx) % options.length];
}

function generateLocations(count, seed) {
  const locations = ['North', 'South', 'East', 'West', 'Central', 'Metro', 'Urban', 'Rural', 'Suburban'];
  const shuffled = [...locations].sort(() => seededRandom(seed++) - 0.5);
  return shuffled.slice(0, Math.min(count, locations.length));
}

function generateNumericColumn(features, topic, index) {
  const seed = hashString(topic + 'num' + index);
  const rand = () => seededRandom(seed + index * 100);
  
  const featureBase = features.numeric_features[Math.floor(rand() * features.numeric_features.length)];
  const entity = features.entities[Math.floor(rand() * features.entities.length)];
  
  const suffixes = ['', '_level', '_value', '_amount', '_rate', '_score', '_index', '_count', '_total'];
  const prefix = index < 2 ? featureBase : entity;
  const suffix = suffixes[Math.floor(rand() * suffixes.length)];
  const name = `${prefix}${suffix}`;
  
  const distributions = ['normal', 'skewed', 'uniform'];
  const distribution = distributions[Math.floor(rand() * distributions.length)];
  
  const rangePatterns = [
    [0, 100],
    [1, 1000],
    [0, 10000],
    [10, 500],
    [50, 200],
    [0, 50],
    [0, 500],
    [0, 1000],
    [0, 250],
    [100, 5000]
  ];
  
  const range = rangePatterns[Math.floor(rand() * rangePatterns.length)].map(v => {
    const variation = 1 + (rand() - 0.5) * 0.3;
    return Math.round(v * variation);
  });
  
  return {
    name,
    type: rand() > 0.3 ? 'float' : 'integer',
    range,
    distribution
  };
}

function generateCategoricalColumn(features, topic, index) {
  const seed = hashString(topic + 'cat' + index);
  const rand = () => seededRandom(seed + index * 100);
  
  const featureBase = features.categorical_features[Math.floor(rand() * features.categorical_features.length)];
  
  const categoryTypes = {
    status: ['Active', 'Inactive', 'Pending', 'Completed', 'Cancelled'],
    type: ['Type A', 'Type B', 'Type C', 'Type D'],
    category: ['Category 1', 'Category 2', 'Category 3'],
    level: ['Low', 'Medium', 'High', 'Critical'],
    priority: ['Low', 'Normal', 'High', 'Urgent'],
    risk: ['Low', 'Medium', 'High'],
    segment: ['Segment A', 'Segment B', 'Segment C'],
    group: ['Group 1', 'Group 2', 'Group 3']
  };
  
  const categoryKey = Object.keys(categoryTypes).find(k => featureBase.includes(k)) || 'type';
  const values = categoryTypes[categoryKey] || ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
  
  const weights = values.map(() => rand() + 0.1);
  const total = weights.reduce((a, b) => a + b, 0);
  
  return {
    name: featureBase,
    type: 'categorical',
    values,
    weights: weights.map(w => w / total)
  };
}

function generateOutcomeColumn(features, taskType) {
  if (taskType === 'regression') {
    return {
      name: 'target_value',
      type: 'float',
      range: [0, 100],
      distribution: 'normal'
    };
  }
  
  return {
    name: 'target',
    type: 'binary',
    range: [0, 1],
    distribution: 'biased'
  };
}

module.exports = { build };
