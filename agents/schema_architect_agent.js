/**
 * CODOZ Schema Architect Agent
 * 
 * Constructs the dataset schema from topic analysis:
 * 1. Build column definitions from topic understanding
 * 2. Define proper ranges and data types
 * 3. Set up constraints and relationships
 * 4. Create generation order
 */

function process(context) {
  const { topicAnalysis, target, features, causalRules } = context;
  
  if (!topicAnalysis) {
    return {
      ...context,
      error: 'Topic analysis required',
      logs: [...context.logs, createLog('error', 'Topic analysis required')]
    };
  }
  
  console.log('━'.repeat(60));
  console.log('PHASE 2: SCHEMA CONSTRUCTION');
  console.log('━'.repeat(60));
  
  console.log(`\nConstructing schema for: ${topicAnalysis.topic}`);
  console.log(`Entity: ${topicAnalysis.entity}`);
  console.log(`Context: ${topicAnalysis.context}`);
  
  // Build the schema
  const schema = buildSchema(topicAnalysis, target, features, causalRules, context);
  
  console.log(`\nSchema built successfully!`);
  console.log(`  - Total columns: ${schema.columns.length}`);
  console.log(`  - Target column: ${schema.targetColumn}`);
  console.log(`  - Feature columns: ${schema.columns.filter(c => !c.isTarget).length}`);
  
  // Generate column summary
  const columnSummary = schema.columns.map(c => ({
    name: c.name,
    type: c.dataType,
    range: c.range ? `${c.range[0]} - ${c.range[1]}` : 'categorical',
    isTarget: c.isTarget
  }));
  
  console.log(`\nColumn definitions:`);
  columnSummary.forEach(col => {
    const targetMark = col.isTarget ? ' [TARGET]' : '';
    const rangeInfo = col.range ? ` (${col.range})` : '';
    console.log(`  - ${col.name}: ${col.type}${rangeInfo}${targetMark}`);
  });
  
  return {
    ...context,
    schema,
    columnCount: schema.columns.length,
    targetColumn: schema.targetColumn,
    featureColumns: schema.columns.filter(c => !c.isTarget).map(c => c.name),
    logs: [...context.logs, createLog('schema_architect_complete', {
      datasetName: topicAnalysis.topic,
      columnCount: schema.columns.length,
      targetColumn: schema.targetColumn,
      entity: topicAnalysis.entity
    })]
  };
}

function buildSchema(topicAnalysis, target, features, causalRules, context) {
  const columns = [];
  const generationOrder = [];
  
  // 1. Add identifier column (always first)
  const idColumn = buildIdColumn(topicAnalysis.entity);
  columns.push(idColumn);
  generationOrder.push(idColumn.name);
  
  // 2. Add target column (always second for classification)
  const targetColumn = buildTargetColumn(target, topicAnalysis);
  columns.push(targetColumn);
  generationOrder.push(targetColumn.name);
  
  // 3. Add demographic columns (early for context)
  const demographicColumns = buildFeatureColumns(features?.demographics, 'demographics');
  demographicColumns.forEach(col => {
    columns.push(col);
    generationOrder.push(col.name);
  });
  
  // 4. Add feature columns grouped by category
  const featureCategories = [
    'metabolic', 'cardiac_exam', 'stress_test', 'blood_test',
    'sensor_readings', 'operational', 'financial', 'job', 
    'compensation', 'career', 'performance', 'transaction',
    'subscription', 'services', 'billing', 'academic', 
    'behavior', 'family', 'social', 'environment',
    'urinalysis', 'cell_characteristics', 'worst_values',
    'liver_function_tests', 'kidney_function', 'pedigree',
    'cardiovascular', 'services', 'product_quality', 'timestamp',
    'location', 'machine', 'applicant', 'loan', 'policy',
    'risk_factors', 'claims', 'merchant', 'account',
    'customer', 'campaign', 'spending'
  ];
  
  for (const category of featureCategories) {
    if (features && features[category]) {
      const categoryColumns = buildFeatureColumns(features[category], category);
      categoryColumns.forEach(col => {
        if (!columns.find(c => c.name === col.name)) {
          columns.push(col);
          generationOrder.push(col.name);
        }
      });
    }
  }
  
  // 5. Add any remaining features
  if (features) {
    for (const [category, featureList] of Object.entries(features)) {
      if (!['demographics'].includes(category)) {
        const categoryColumns = buildFeatureColumns(featureList, category);
        categoryColumns.forEach(col => {
          if (!columns.find(c => c.name === col.name)) {
            columns.push(col);
            generationOrder.push(col.name);
          }
        });
      }
    }
  }
  
  // Build constraints
  const constraints = buildConstraints(causalRules, target, columns);
  
  return {
    columns,
    targetColumn: targetColumn.name,
    generationOrder,
    constraints,
    entity: topicAnalysis.entity,
    context: topicAnalysis.context
  };
}

function buildIdColumn(entity) {
  const entityNames = {
    patient: 'patient_id',
    student: 'student_id',
    employee: 'employee_id',
    transaction: 'transaction_id',
    machine: 'machine_id',
    customer: 'customer_id',
    record: 'record_id',
    sample: 'sample_id'
  };
  
  return {
    name: entityNames[entity] || 'id',
    dataType: 'uuid',
    description: 'Unique record identifier',
    isTarget: false,
    isId: true,
    nullable: false,
    range: null,
    categories: null
  };
}

function buildTargetColumn(target, topicAnalysis) {
  const isRegression = target?.type === 'regression';
  const isMultiClass = target?.type === 'multi_class_classification';
  
  if (isRegression) {
    return {
      name: target.name,
      dataType: 'float',
      description: target.description || 'Target variable',
      isTarget: true,
      isId: false,
      nullable: false,
      range: target.values,
      categories: null,
      unit: null
    };
  }
  
  return {
    name: target.name,
    dataType: 'categorical',
    description: target.description || 'Target variable',
    isTarget: true,
    isId: false,
    nullable: false,
    range: null,
    categories: target.values,
    unit: null
  };
}

function buildFeatureColumns(featureList, category) {
  if (!featureList || !Array.isArray(featureList)) {
    return [];
  }
  
  return featureList.map(feature => {
    // Skip ID columns
    if (feature.type === 'uuid' || feature.name === 'id') {
      return null;
    }
    
    return {
      name: feature.name,
      dataType: normalizeDataType(feature.type),
      description: feature.description || `${feature.name} feature`,
      isTarget: false,
      isId: false,
      nullable: false,
      range: feature.range || null,
      categories: feature.categories || null,
      unit: feature.unit || null,
      conditional: feature.conditional || null,
      critical: feature.critical || false,
      category: category
    };
  }).filter(c => c !== null);
}

function normalizeDataType(type) {
  const typeMap = {
    'integer': 'int',
    'float': 'float',
    'categorical': 'categorical',
    'binary': 'binary',
    'boolean': 'boolean',
    'uuid': 'uuid',
    'date': 'datetime',
    'datetime': 'datetime'
  };
  
  return typeMap[type] || type;
}

function buildConstraints(causalRules, target, columns) {
  const constraints = {
    targetRules: [],
    correlationRules: [],
    conditionalRules: []
  };
  
  // Build target-based rules
  if (target?.values && target.values.length > 0) {
    target.values.forEach(value => {
      constraints.targetRules.push({
        targetValue: value,
        features: buildFeatureConstraintsForTarget(columns, value, target)
      });
    });
  }
  
  // Build causal rules
  if (causalRules && Array.isArray(causalRules)) {
    causalRules.forEach(rule => {
      if (rule.type === 'target_rule') {
        constraints.targetRules.push({
          condition: rule.condition,
          targetValue: rule.target_value,
          confidence: rule.confidence
        });
      } else if (rule.direction) {
        constraints.correlationRules.push({
          feature: rule.feature,
          affected: rule.affected,
          direction: rule.direction,
          confidence: rule.confidence
        });
      }
    });
  }
  
  // Build conditional rules (e.g., pregnancy only for female)
  columns.forEach(col => {
    if (col.conditional) {
      constraints.conditionalRules.push({
        feature: col.name,
        condition: col.conditional
      });
    }
  });
  
  return constraints;
}

function buildFeatureConstraintsForTarget(columns, targetValue, target) {
  const constraints = {};
  
  // For each column, determine if it has different ranges for different target values
  columns.forEach(col => {
    if (col.isTarget || !col.range) return;
    
    // Default range
    constraints[col.name] = {
      default: col.range
    };
  });
  
  return constraints;
}

function createLog(event, data) {
  return {
    timestamp: new Date().toISOString(),
    event,
    data
  };
}

module.exports = { process };
