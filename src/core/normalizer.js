/**
 * Normalizer
 * Converts all datasets into a common schema
 */

function normalizeDataset(dataset, sourceInfo) {
  if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
    return null;
  }
  
  const normalizedRows = dataset.map((row, index) => {
    const normalized = normalizeRow(row, index);
    normalized._source = sourceInfo.source;
    normalized._sourceId = sourceInfo.identifier;
    return normalized;
  });
  
  const schema = inferSchema(normalizedRows);
  
  return {
    rows: normalizedRows,
    schema,
    source: sourceInfo.source,
    rowCount: normalizedRows.length
  };
}

function normalizeRow(row, index) {
  const normalized = {};
  
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key);
    normalized[normalizedKey] = normalizeValue(value);
  }
  
  if (!normalized.id && !normalized.patient_id && !normalized.customer_id) {
    normalized.id = `row_${index + 1}`;
  }
  
  return normalized;
}

function normalizeColumnName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function normalizeValue(value) {
  if (value === null || value === undefined || value === 'NA' || value === 'NaN' || value === 'null' || value === '') {
    return null;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    const num = parseFloat(trimmed);
    if (!isNaN(num) && trimmed !== '') {
      return num;
    }
    
    const lower = trimmed.toLowerCase();
    if (lower === 'true' || lower === 'yes' || lower === '1') return true;
    if (lower === 'false' || lower === 'no' || lower === '0') return false;
    
    return trimmed;
  }
  
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return null;
    return value;
  }
  
  return value;
}

function inferSchema(rows) {
  if (rows.length === 0) return { columns: [], rowCount: 0 };
  
  const columnFreq = {};
  
  rows.forEach(row => {
    Object.keys(row).forEach(col => {
      if (!col.startsWith('_')) {
        columnFreq[col] = (columnFreq[col] || 0) + 1;
      }
    });
  });
  
  const columns = Object.entries(columnFreq)
    .map(([name, freq]) => ({
      name,
      frequency: freq / rows.length,
      type: inferColumnType(rows, name)
    }))
    .sort((a, b) => b.frequency - a.frequency);
  
  return {
    columns,
    rowCount: rows.length
  };
}

function inferColumnType(rows, columnName) {
  const values = rows.map(r => r[columnName]).filter(v => v !== null && v !== undefined);
  
  if (values.length === 0) return 'unknown';
  
  const types = values.map(v => {
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'number') return 'number';
    if (typeof v === 'string') {
      if (v.match(/^\d{4}-\d{2}-\d{2}/)) return 'date';
      return 'string';
    }
    return 'unknown';
  });
  
  const typeCounts = {};
  types.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });
  
  return Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
}

function harmonizeSchema(datasets) {
  const allColumns = new Set();
  
  datasets.forEach(ds => {
    ds.schema.columns.forEach(col => {
      if (!col.name.startsWith('_')) {
        allColumns.add(col.name);
      }
    });
  });
  
  const columnMappings = {};
  const normalizedColumns = Array.from(allColumns);
  
  normalizedColumns.forEach(col => {
    const similar = normalizedColumns.filter(c => 
      c !== col && (c.includes(col) || col.includes(c) || levenshtein(c, col) < 3)
    );
    
    columnMappings[col] = {
      canonical: col,
      aliases: similar
    };
  });
  
  return {
    unifiedSchema: Array.from(allColumns),
    columnMappings,
    sourceCount: datasets.length
  };
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

module.exports = { normalizeDataset, normalizeRow, normalizeColumnName, normalizeValue, inferSchema, harmonizeSchema };
