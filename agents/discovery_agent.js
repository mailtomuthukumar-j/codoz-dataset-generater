const { websearch } = require('../tools/web_search');

function process(context) {
  if (!context.search_queries || context.search_queries.length === 0) {
    return {
      ...context,
      schema_refs: [],
      logs: [...context.logs, {
        timestamp: new Date().toISOString(),
        event: 'discovery_complete',
        data: { ref_count: 0, fallback_reason: 'no search queries provided' }
      }]
    };
  }
  
  const schema_refs = [];
  
  for (const query of context.search_queries.slice(0, 3)) {
    try {
      const refs = searchForSchemaRefs(query, context.domain);
      schema_refs.push(...refs);
    } catch (error) {
      context.logs.push({
        timestamp: new Date().toISOString(),
        event: 'discovery_error',
        data: { query, error: error.message }
      });
    }
  }
  
  const deduplicated = deduplicateRefs(schema_refs);
  
  return {
    ...context,
    schema_refs: deduplicated.slice(0, 5),
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'discovery_complete',
      data: { ref_count: deduplicated.length, sources: [...new Set(deduplicated.map(r => r.source))] }
    }]
  };
}

async function searchForSchemaRefs(query, domain) {
  const refs = [];
  
  try {
    const results = await websearch(query, 5);
    
    for (const result of results) {
      const ref = extractSchemaFromResult(result, domain);
      if (ref) {
        refs.push(ref);
      }
    }
  } catch (error) {
    console.log(`Search error for query "${query}": ${error.message}`);
  }
  
  return refs;
}

function extractSchemaFromResult(result, domain) {
  const title = result.title || '';
  const snippet = result.snippet || '';
  const url = result.url || '';
  
  if (!title && !snippet) return null;
  
  const columns = extractColumnsFromText(title + ' ' + snippet, domain);
  
  if (columns.length === 0) return null;
  
  const source = detectSource(url);
  
  return {
    source,
    dataset_name: title.substring(0, 100),
    url: url.substring(0, 500),
    columns,
    row_count: estimateRowCount(snippet),
    target_column: detectTargetColumn(columns, snippet),
    label_distribution: estimateLabelDistribution(snippet),
    notable_correlations: extractCorrelations(snippet, columns)
  };
}

function extractColumnsFromText(text, domain) {
  const columns = [];
  const columnPatterns = {
    medical: ['glucose', 'bmi', 'blood_pressure', 'cholesterol', 'heart_rate', 'age', 'pregnancies', 'insulin', 'outcome', 'diagnosis', 'treatment'],
    financial: ['income', 'credit_score', 'loan_amount', 'balance', 'debt', 'payment', 'default', 'transaction', 'account', 'fraud'],
    retail: ['customer_id', 'product_id', 'price', 'quantity', 'sales', 'rating', 'review', 'churn', 'purchase', 'order'],
    environmental: ['temperature', 'humidity', 'pm25', 'pm10', 'aqi', 'emission', 'pollutant', 'concentration'],
    social: ['followers', 'following', 'likes', 'engagement', 'posts', 'comments', 'shares'],
    hr: ['employee_id', 'salary', 'tenure', 'performance', 'department', 'attrition'],
    telecom: ['subscriber', 'plan', 'minutes', 'data_usage', 'charges', 'churn'],
    ecommerce: ['order_id', 'product_id', 'customer_id', 'price', 'shipping', 'delivery', 'rating'],
    education: ['student_id', 'gpa', 'score', 'grade', 'attendance', 'enrollment'],
    default: ['id', 'value', 'category', 'label', 'status', 'count', 'score']
  };
  
  const domainColumns = columnPatterns[domain] || columnPatterns.default;
  const textLower = text.toLowerCase();
  
  const foundColumns = new Set();
  for (const col of domainColumns) {
    if (textLower.includes(col)) {
      foundColumns.add(col);
    }
  }
  
  for (const col of foundColumns) {
    columns.push({
      name: col,
      dtype: inferDtype(col),
      sample_values: generateSampleValues(col),
      range: getRangeForColumn(col),
      categories: getCategoriesForColumn(col)
    });
  }
  
  return columns;
}

function inferDtype(columnName) {
  const name = columnName.toLowerCase();
  
  if (name.includes('id') || name.includes('name') || name.includes('status') || name.includes('type') || name.includes('category')) {
    return 'categorical';
  }
  if (name.includes('date') || name.includes('time')) {
    return 'datetime';
  }
  if (name.includes('is_') || name.includes('has_') || name.includes('flag')) {
    return 'boolean';
  }
  if (name.includes('count') || name.includes('age') || name.includes('year') || name.includes('duration')) {
    return 'int';
  }
  if (name.includes('rate') || name.includes('ratio') || name.includes('score') || name.includes('percent') || name.includes('level')) {
    return 'float';
  }
  
  return 'float';
}

function generateSampleValues(columnName) {
  const name = columnName.toLowerCase();
  
  if (name.includes('status')) return ['Active', 'Inactive', 'Pending'];
  if (name.includes('type')) return ['Type A', 'Type B', 'Type C'];
  if (name.includes('gender')) return ['Male', 'Female'];
  if (name.includes('education')) return ['High School', 'Bachelor', 'Master', 'PhD'];
  if (name.includes('is_') || name.includes('has_')) return [true, false];
  
  return null;
}

function getRangeForColumn(columnName) {
  const name = columnName.toLowerCase();
  
  const ranges = {
    age: [18, 100],
    score: [0, 100],
    rating: [1, 5],
    income: [10000, 500000],
    price: [0, 10000],
    quantity: [1, 100],
    rate: [0, 1],
    percentage: [0, 100],
    balance: [0, 100000],
    count: [0, 10000]
  };
  
  for (const [key, range] of Object.entries(ranges)) {
    if (name.includes(key)) return range;
  }
  
  return [0, 100];
}

function getCategoriesForColumn(columnName) {
  const name = columnName.toLowerCase();
  
  const categories = {
    status: ['Active', 'Inactive', 'Pending', 'Completed'],
    gender: ['Male', 'Female'],
    education: ['High School', 'Bachelor', 'Master', 'PhD'],
    level: ['Low', 'Medium', 'High'],
    priority: ['Low', 'Normal', 'High', 'Urgent'],
    risk: ['Low', 'Medium', 'High']
  };
  
  for (const [key, cats] of Object.entries(categories)) {
    if (name.includes(key)) return cats;
  }
  
  return null;
}

function detectSource(url) {
  if (url.includes('kaggle')) return 'Kaggle';
  if (url.includes('uci.edu') || url.includes('archive.ics.uci')) return 'UCI';
  if (url.includes('paperswithcode')) return 'PapersWithCode';
  if (url.includes('github')) return 'GitHub';
  if (url.includes('huggingface') || url.includes('hf.co')) return 'HuggingFace';
  return 'Web';
}

function estimateRowCount(snippet) {
  const patterns = [
    /(\d+)[\s,]*(?:rows?|records?|samples?|observations?)/gi,
    /(?:dataset|dataset)\s+(?:of|with)\s+(\d+)[\s,]*(?:rows?|records?)/gi
  ];
  
  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match) {
      const num = parseInt(match[1].replace(/,/g, ''));
      if (num > 100) return num;
    }
  }
  
  return null;
}

function detectTargetColumn(columns, snippet) {
  const targetKeywords = ['target', 'outcome', 'label', 'class', 'prediction', 'result', 'diagnosis', 'fraud', 'churn', 'default'];
  const snippetLower = snippet.toLowerCase();
  
  for (const col of columns) {
    const colLower = col.name.toLowerCase();
    for (const keyword of targetKeywords) {
      if (colLower.includes(keyword)) {
        return col.name;
      }
    }
  }
  
  return columns[columns.length - 1]?.name || 'target';
}

function estimateLabelDistribution(snippet) {
  const snippetLower = snippet.toLowerCase();
  
  if (snippetLower.includes('balanced') || snippetLower.includes('equal')) {
    return { '0': 0.5, '1': 0.5 };
  }
  if (snippetLower.includes('imbalanced') || snippetLower.includes('skewed')) {
    return { '0': 0.8, '1': 0.2 };
  }
  if (snippetLower.includes('binary')) {
    return { '0': 0.65, '1': 0.35 };
  }
  
  return null;
}

function extractCorrelations(snippet, columns) {
  const correlations = [];
  const snippetLower = snippet.toLowerCase();
  
  for (const col of columns) {
    if (snippetLower.includes(`${col.name} increases`) || snippetLower.includes(`${col.name} correlated`)) {
      correlations.push(`${col.name} positively correlated with outcome`);
    }
  }
  
  return correlations;
}

function deduplicateRefs(refs) {
  const seen = new Set();
  const unique = [];
  
  for (const ref of refs) {
    const key = ref.dataset_name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(ref);
    }
  }
  
  return unique;
}

module.exports = { process };
