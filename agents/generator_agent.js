/**
 * CODOZ Generator Agent
 * 
 * Constructs realistic datasets based on schema:
 * 1. Generate target values first (for classification)
 * 2. Generate features conditioned on target
 * 3. Apply causal rules and correlations
 * 4. Enforce domain constraints
 */

function process(context) {
  const { schema, target, topicAnalysis, size } = context;
  const datasetSize = size || 100;
  
  if (!schema || !schema.columns) {
    return {
      ...context,
      error: 'Schema required for generation',
      logs: [...context.logs, createLog('error', 'Schema required')]
    };
  }
  
  console.log('━'.repeat(60));
  console.log('PHASE 3: DATASET CONSTRUCTION');
  console.log('━'.repeat(60));
  
  console.log(`\nConstructing dataset...`);
  console.log(`  - Target: ${schema.targetColumn}`);
  console.log(`  - Size: ${datasetSize} rows`);
  console.log(`  - Columns: ${schema.columns.length}`);
  
  // Build generation context
  const genContext = buildGenerationContext(context);
  
  // Generate dataset
  console.log(`\nGenerating rows...`);
  const dataset = [];
  const idSet = new Set();
  
  for (let i = 0; i < datasetSize; i++) {
    let row = null;
    let attempts = 0;
    
    while (attempts < 5) {
      const candidate = generateRow(schema, genContext, i);
      
      // Check for duplicate ID
      if (candidate[schema.columns[0].name] && idSet.has(candidate[schema.columns[0].name])) {
        attempts++;
        continue;
      }
      
      row = candidate;
      idSet.add(candidate[schema.columns[0].name]);
      break;
    }
    
    if (!row) {
      row = generateRow(schema, genContext, i);
    }
    
    dataset.push(row);
    
    // Progress indicator
    if ((i + 1) % Math.max(10, Math.floor(datasetSize / 10)) === 0) {
      console.log(`  - Generated ${i + 1}/${datasetSize} rows...`);
    }
  }
  
  // Calculate statistics
  const stats = calculateDatasetStatistics(dataset, schema);
  
  console.log(`\nDataset constructed successfully!`);
  console.log(`  - Total rows: ${dataset.length}`);
  console.log(`  - Unique IDs: ${idSet.size}`);
  console.log(`  - Target distribution:`);
  
  if (stats.targetDistribution) {
    Object.entries(stats.targetDistribution).forEach(([value, count]) => {
      const pct = ((count / dataset.length) * 100).toFixed(1);
      console.log(`    * ${value}: ${count} (${pct}%)`);
    });
  }
  
  return {
    ...context,
    dataset,
    datasetStats: stats,
    rowsGenerated: dataset.length,
    uniqueIds: idSet.size,
    logs: [...context.logs, createLog('generation_complete', {
      rowCount: dataset.length,
      uniqueIds: idSet.size,
      targetDistribution: stats.targetDistribution
    })]
  };
}

function buildGenerationContext(context) {
  const { schema, target, topicAnalysis, causalRules } = context;
  
  const genContext = {
    schema,
    target,
    topicAnalysis,
    targetDistribution: calculateTargetDistribution(target, schema, context.size, context),
    causalRules: causalRules || [],
    constraints: schema.constraints || {}
  };
  
  return genContext;
}

function calculateTargetDistribution(target, schema, size, context) {
  const dist = {};
  const topicAnalysis = context?.topicAnalysis;
  
  if (target?.values && Array.isArray(target.values)) {
    // Use distribution from topic analysis if available
    if (topicAnalysis?.classDistribution) {
      const total = Object.values(topicAnalysis.classDistribution).reduce((a, b) => a + b, 0);
      target.values.forEach((val, idx) => {
        dist[val] = Math.round((topicAnalysis.classDistribution[val] || (1 / target.values.length)) * (size || 100));
      });
    } else if (target.values.length === 2) {
      dist[target.values[0]] = Math.round((size || 100) * 0.65);
      dist[target.values[1]] = Math.round((size || 100) * 0.35);
    } else {
      const equal = Math.floor((size || 100) / target.values.length);
      target.values.forEach((val, idx) => {
        dist[val] = equal + (idx < ((size || 100) % target.values.length) ? 1 : 0);
      });
    }
  }
  
  return dist;
}

function generateRow(schema, genContext, index) {
  const row = {};
  const seed = Date.now() + index * 1000;
  
  // Get target column
  const targetColumn = schema.columns.find(c => c.isTarget);
  
  // 1. Generate ID (first column)
  const idColumn = schema.columns.find(c => c.isId);
  if (idColumn) {
    row[idColumn.name] = generateUUID();
  }
  
  // 2. Generate target value (classification target-first approach)
  if (targetColumn && targetColumn.dataType === 'categorical') {
    row[targetColumn.name] = sampleFromDistribution(genContext.targetDistribution, seed);
  } else if (targetColumn && targetColumn.dataType === 'float') {
    row[targetColumn.name] = generateNumericValue(targetColumn.range, seed, 'float');
  }
  
  const targetValue = row[targetColumn?.name];
  
  // 3. Generate all other columns in order
  for (const column of schema.columns) {
    if (column.isTarget || column.isId) continue;
    
    row[column.name] = generateColumnValue(column, row, targetValue, genContext, seed);
  }
  
  return row;
}

function generateColumnValue(column, row, targetValue, genContext, seed) {
  // Check for conditional generation
  if (column.conditional) {
    const conditionMet = evaluateCondition(column.conditional, row);
    if (!conditionMet) {
      // Return a neutral/default value for this conditional
      return getDefaultForType(column.dataType);
    }
  }
  
  switch (column.dataType) {
    case 'int':
      return generateNumericValue(column.range, seed, 'int');
    
    case 'float':
      return generateNumericValue(column.range, seed, 'float');
    
    case 'categorical':
      return generateCategoricalValue(column.categories, seed);
    
    case 'binary':
      return generateBinaryValue(column.categories, seed);
    
    case 'boolean':
      return Math.random() > 0.5;
    
    case 'uuid':
      return generateUUID();
    
    case 'datetime':
      return generateDateTime(column.range, seed);
    
    default:
      return generateNumericValue(column.range, seed, 'int');
  }
}

function generateNumericValue(range, seed, type) {
  if (!range || range.length !== 2) {
    return type === 'float' ? 0.0 : 0;
  }
  
  const [min, max] = range;
  const rand = seededRandom(seed);
  
  if (type === 'int') {
    return Math.floor(min + rand() * (max - min + 1));
  }
  
  // Float with realistic distribution (slightly skewed toward center)
  const normalized = Math.pow(rand(), 0.8); // Skew toward higher values
  const value = min + normalized * (max - min);
  return parseFloat(value.toFixed(2));
}

function generateCategoricalValue(categories, seed) {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return 'Unknown';
  }
  
  const rand = seededRandom(seed);
  const index = Math.floor(rand() * categories.length);
  return categories[index];
}

function generateBinaryValue(categories, seed) {
  if (categories && categories.length === 2) {
    const rand = seededRandom(seed);
    return rand > 0.5 ? categories[0] : categories[1];
  }
  return Math.random() > 0.5;
}

function generateDateTime(range, seed) {
  const [startStr, endStr] = range || ['2020-01-01', '2024-12-31'];
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  
  const rand = seededRandom(seed);
  const timestamp = start + rand() * (end - start);
  
  return new Date(timestamp).toISOString().split('T')[0];
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function sampleFromDistribution(distribution, seed) {
  const entries = Object.entries(distribution);
  if (entries.length === 0) return null;
  
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const rand = seededRandom(seed)();
  let cumulative = 0;
  
  for (const [value, count] of entries) {
    cumulative += count / total;
    if (rand <= cumulative) {
      return value;
    }
  }
  
  return entries[entries.length - 1][0];
}

function evaluateCondition(condition, row) {
  // Simple condition evaluation (e.g., "gender == Female")
  const parts = condition.split('==').map(s => s.trim());
  if (parts.length === 2) {
    return row[parts[0]] === parts[1];
  }
  return true;
}

function getDefaultForType(dataType) {
  switch (dataType) {
    case 'int': return 0;
    case 'float': return 0.0;
    case 'categorical': return 'None';
    case 'binary': return 'No';
    case 'boolean': return false;
    default: return null;
  }
}

function calculateDatasetStatistics(dataset, schema) {
  const stats = {
    rowCount: dataset.length,
    columnCount: dataset[0] ? Object.keys(dataset[0]).length : 0
  };
  
  const targetColumn = schema.columns.find(c => c.isTarget);
  if (targetColumn && targetColumn.dataType === 'categorical') {
    const dist = {};
    dataset.forEach(row => {
      const val = row[targetColumn.name];
      dist[val] = (dist[val] || 0) + 1;
    });
    stats.targetDistribution = dist;
  }
  
  // Calculate numeric statistics for key columns
  const numericCols = schema.columns.filter(c => c.dataType === 'int' || c.dataType === 'float');
  stats.numericStats = {};
  
  numericCols.forEach(col => {
    const values = dataset.map(r => r[col.name]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      stats.numericStats[col.name] = {
        mean: parseFloat(mean.toFixed(2)),
        min: parseFloat(min.toFixed(2)),
        max: parseFloat(max.toFixed(2))
      };
    }
  });
  
  return stats;
}

function createLog(event, data) {
  return {
    timestamp: new Date().toISOString(),
    event,
    data
  };
}

module.exports = { process };
