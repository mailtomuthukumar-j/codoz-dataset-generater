const DOMAIN_CONSTRAINTS = {
  medical: {
    deterministic: [
      {
        id: 'md_001',
        description: 'Pregnancies only valid for female gender',
        trigger: { column: 'gender', operator: 'not_equals', value: 'female' },
        forced: { column: 'pregnancies', value: 0 }
      },
      {
        id: 'md_002',
        description: 'Age must be >= pregnancies * 18 (minimum age per pregnancy)',
        trigger: { column: 'pregnancies', operator: 'greater_than', value: 0 },
        constraint: { column: 'age', operator: 'gte', expression: 'pregnancies * 18 + 14' }
      },
      {
        id: 'md_003',
        description: 'HbA1c must be consistent with glucose levels',
        trigger: { column: 'glucose', operator: 'lt', value: 100 },
        probability_adjust: { column: 'hba1c', max: 5.6 }
      },
      {
        id: 'md_004',
        description: 'Very high glucose implies high HbA1c',
        trigger: { column: 'glucose', operator: 'gt', value: 200 },
        probability_adjust: { column: 'hba1c', min: 8.0 }
      }
    ],
    correlations: [
      { driving: 'glucose', dependent: 'hba1c', type: 'positive_linear', strength: 0.85 },
      { driving: 'bmi', dependent: 'blood_pressure_systolic', type: 'positive_linear', strength: 0.55 },
      { driving: 'bmi', dependent: 'blood_pressure_diastolic', type: 'positive_linear', strength: 0.45 },
      { driving: 'age', dependent: 'blood_pressure_systolic', type: 'positive_linear', strength: 0.40 },
      { driving: 'age', dependent: 'cholesterol', type: 'positive_linear', strength: 0.35 }
    ]
  },
  financial: {
    deterministic: [
      {
        id: 'fn_001',
        description: 'Credit score below 580 typically means subprime',
        trigger: { column: 'credit_score', operator: 'lt', value: 580 },
        forced: { column: 'loan_interest_rate', min: 12.0 }
      },
      {
        id: 'fn_002',
        description: 'Debt ratio > 0.4 is high risk',
        trigger: { column: 'debt_ratio', operator: 'gt', value: 0.4 },
        probability_adjust: { column: 'approval_status', weights: { 'Denied': 0.7, 'Approved': 0.3 } }
      },
      {
        id: 'fn_003',
        description: 'Income determines maximum loan eligibility',
        trigger: { column: 'loan_amount', operator: 'gt', expression: 'income * 5' },
        probability_adjust: { column: 'approval_status', weights: { 'Denied': 0.8, 'Approved': 0.2 } }
      }
    ],
    correlations: [
      { driving: 'credit_score', dependent: 'income', type: 'positive_linear', strength: 0.50 },
      { driving: 'credit_score', dependent: 'loan_interest_rate', type: 'negative_linear', strength: 0.75 },
      { driving: 'income', dependent: 'loan_amount', type: 'positive_linear', strength: 0.60 },
      { driving: 'debt_ratio', dependent: 'payment_history', type: 'negative_linear', strength: 0.65 }
    ]
  },
  education: {
    deterministic: [
      {
        id: 'ed_001',
        description: 'Study hours correlate with attendance',
        trigger: { column: 'study_hours', operator: 'lt', value: 5 },
        probability_adjust: { column: 'attendance_rate', max_expected: 50 }
      },
      {
        id: 'ed_002',
        description: 'GPA below 2.0 is academic probation',
        trigger: { column: 'gpa', operator: 'lt', value: 2.0 },
        probability_adjust: { column: 'pass_status', weights: { 'Fail': 0.75, 'Pass': 0.25 } }
      }
    ],
    correlations: [
      { driving: 'study_hours', dependent: 'gpa', type: 'positive_linear', strength: 0.70 },
      { driving: 'attendance_rate', dependent: 'gpa', type: 'positive_linear', strength: 0.60 },
      { driving: 'study_hours', dependent: 'attendance_rate', type: 'positive_linear', strength: 0.55 }
    ]
  },
  sports: {
    deterministic: [
      {
        id: 'sp_001',
        description: 'K/D ratio must be consistent with kills and deaths',
        constraint: { expression: 'kills_deaths_ratio = kills / (deaths + 1)' }
      },
      {
        id: 'sp_002',
        description: 'Very high kills implies good win rate',
        trigger: { column: 'kills', operator: 'gt', value: 25 },
        probability_adjust: { column: 'win_rate', min_expected: 55 }
      }
    ],
    correlations: [
      { driving: 'kills', dependent: 'kills_deaths_ratio', type: 'positive_linear', strength: 0.90 },
      { driving: 'deaths', dependent: 'win_rate', type: 'negative_linear', strength: 0.70 },
      { driving: 'assists', dependent: 'kills', type: 'positive_linear', strength: 0.65 }
    ]
  },
  environmental: {
    deterministic: [
      {
        id: 'env_001',
        description: 'PM2.5 high implies poor AQI',
        trigger: { column: 'pm25', operator: 'gt', value: 150 },
        forced: { column: 'aqi_category', value: 'Unhealthy' }
      },
      {
        id: 'env_002',
        description: 'High temperature and low humidity increases fire risk',
        trigger: { column: 'temperature', operator: 'gt', value: 30 },
        secondary_trigger: { column: 'humidity', operator: 'lt', value: 30 },
        forced: { column: 'fire_risk', value: 'High' }
      }
    ],
    correlations: [
      { driving: 'pm25', dependent: 'aqi', type: 'positive_linear', strength: 0.92 },
      { driving: 'temperature', dependent: 'humidity', type: 'negative_linear', strength: 0.45 },
      { driving: 'wind_speed', dependent: 'fire_risk', type: 'non_linear_threshold', strength: 0.60 }
    ]
  }
};

function process(context) {
  const { domain, task_type, schema, ontology } = context;
  
  if (!schema || !schema.columns) {
    return {
      ...context,
      rules: { deterministic: [], correlations: [], generation_order: [] },
      logs: [...context.logs, { timestamp: new Date().toISOString(), event: 'logic_rules_error', data: { error: 'No schema available' } }]
    };
  }
  
  const domainRules = DOMAIN_CONSTRAINTS[domain] || DOMAIN_CONSTRAINTS.default || { deterministic: [], correlations: [] };
  
  const filteredRules = filterRulesForSchema(domainRules, schema.columns);
  
  const generationOrder = computeGenerationOrder(schema.columns, filteredRules.correlations);
  
  const rules = {
    deterministic: filteredRules.deterministic,
    correlations: filteredRules.correlations,
    generation_order: generationOrder,
    domain_constraints: DOMAIN_CONSTRAINTS[domain] || {}
  };
  
  return {
    ...context,
    rules,
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'logic_rules_complete',
      data: {
        deterministic_rules: rules.deterministic.length,
        correlations: rules.correlations.length,
        generation_order: generationOrder.slice(0, 5).join(' -> ') + (generationOrder.length > 5 ? ' -> ...' : '')
      }
    }]
  };
}

function filterRulesForSchema(domainRules, columns) {
  const columnNames = new Set(columns.map(c => c.name));
  const columnRanges = {};
  columns.forEach(c => columnRanges[c.name] = c.range);
  
  const filteredDeterministic = (domainRules.deterministic || []).filter(rule => {
    if (rule.trigger?.column && !columnNames.has(rule.trigger.column)) {
      return false;
    }
    if (rule.forced?.column && !columnNames.has(rule.forced.column)) {
      return false;
    }
    return true;
  });
  
  const filteredCorrelations = (domainRules.correlations || []).filter(corr => {
    return columnNames.has(corr.driving) && columnNames.has(corr.dependent);
  });
  
  return {
    deterministic: filteredDeterministic,
    correlations: filteredCorrelations
  };
}

function computeGenerationOrder(columns, correlations) {
  const order = [];
  const columnSet = new Set(columns.map(c => c.name));
  const processed = new Set();
  const inDegree = {};
  
  columns.forEach(c => { inDegree[c.name] = 0; });
  
  correlations.forEach(corr => {
    if (inDegree[corr.dependent] !== undefined) {
      inDegree[corr.dependent]++;
    }
  });
  
  const idColumns = columns.filter(c => c.dtype === 'uuid' || c.name === 'id');
  idColumns.forEach(c => order.push(c.name));
  idColumns.forEach(c => processed.add(c.name));
  
  const targetColumn = columns.find(c => c.is_target);
  if (targetColumn) {
    order.push(targetColumn.name);
    processed.add(targetColumn.name);
  }
  
  const demographics = columns.filter(c => 
    ['age', 'gender', 'income', 'tenure_years'].includes(c.name)
  );
  demographics.forEach(c => {
    if (!processed.has(c.name)) {
      order.push(c.name);
      processed.add(c.name);
    }
  });
  
  while (order.length < columns.length) {
    let added = false;
    
    for (const corr of correlations) {
      if (processed.has(corr.driving) && !processed.has(corr.dependent)) {
        order.push(corr.dependent);
        processed.add(corr.dependent);
        added = true;
        break;
      }
    }
    
    if (!added) {
      for (const col of columns) {
        if (!processed.has(col.name)) {
          order.push(col.name);
          processed.add(col.name);
          added = true;
          break;
        }
      }
    }
    
    if (!added) break;
  }
  
  return order;
}

function evaluateConstraint(row, constraint, schemaColumns) {
  const col = schemaColumns.find(c => c.name === constraint.column);
  if (!col) return true;
  
  const value = row[constraint.column];
  
  switch (constraint.operator) {
    case 'gt':
      return value > constraint.value;
    case 'gte':
      if (typeof constraint.expression === 'string') {
        const exprValue = evaluateExpression(constraint.expression, row);
        return value >= exprValue;
      }
      return value >= constraint.value;
    case 'lt':
      return value < constraint.value;
    case 'lte':
      return value <= constraint.value;
    case 'equals':
      return value === constraint.value;
    case 'not_equals':
      return value !== constraint.value;
    default:
      return true;
  }
}

function evaluateExpression(expr, row) {
  let result = expr;
  
  const varPattern = /(\w+)/g;
  result = result.replace(varPattern, (match) => {
    if (row[match] !== undefined) {
      return row[match];
    }
    return match;
  });
  
  try {
    result = Function('"use strict"; return (' + result + ')')();
  } catch (e) {
    return 0;
  }
  
  return result;
}

function applyDeterministicRules(row, rules, schemaColumns) {
  const updatedRow = { ...row };
  
  for (const rule of rules) {
    if (!rule.trigger) continue;
    
    const triggerValue = updatedRow[rule.trigger.column];
    let triggerMet = false;
    
    switch (rule.trigger.operator) {
      case 'gt':
        triggerMet = triggerValue > rule.trigger.value;
        break;
      case 'lt':
        triggerMet = triggerValue < rule.trigger.value;
        break;
      case 'equals':
        triggerMet = triggerValue === rule.trigger.value;
        break;
      case 'not_equals':
        triggerMet = triggerValue !== rule.trigger.value;
        break;
    }
    
    if (rule.secondary_trigger) {
      const secondaryValue = updatedRow[rule.secondary_trigger.column];
      let secondaryMet = false;
      switch (rule.secondary_trigger.operator) {
        case 'gt':
          secondaryMet = secondaryValue > rule.secondary_trigger.value;
          break;
        case 'lt':
          secondaryMet = secondaryValue < rule.secondary_trigger.value;
          break;
      }
      triggerMet = triggerMet && secondaryMet;
    }
    
    if (triggerMet && rule.forced) {
      updatedRow[rule.forced.column] = rule.forced.value;
    }
  }
  
  return updatedRow;
}

module.exports = { process, evaluateConstraint, applyDeterministicRules, computeGenerationOrder };
