/**
 * Validator
 * Validates and cleans data rows
 */

function validateDataset(dataset, options = {}) {
  if (!dataset || !dataset.rows || dataset.rows.length === 0) {
    return {
      valid: false,
      errors: ['Empty or null dataset'],
      cleanedRows: []
    };
  }
  
  const issues = [];
  const cleanedRows = [];
  let rowsRemoved = 0;
  
  dataset.rows.forEach((row, index) => {
    const validation = validateRow(row, index, options);
    
    if (validation.valid) {
      cleanedRows.push(validation.cleanedRow);
    } else {
      if (validation.removed) {
        rowsRemoved++;
      }
      validation.issues.forEach(issue => {
        issues.push({ row: index, issue });
      });
    }
  });
  
  const schema = dataset.schema || {};
  const columnCoverage = calculateColumnCoverage(cleanedRows, schema.columns);
  
  return {
    valid: cleanedRows.length > 0,
    originalCount: dataset.rows.length,
    cleanedCount: cleanedRows.length,
    rowsRemoved,
    issues: issues.slice(0, 100),
    columnCoverage,
    qualityScore: calculateQualityScore(cleanedRows, dataset)
  };
}

function validateRow(row, index, options = {}) {
  const cleanedRow = { ...row };
  const issues = [];
  let removed = false;
  
  if (!row || typeof row !== 'object') {
    return { valid: false, removed: true, issues: ['Invalid row object'] };
  }
  
  const nullThreshold = options.nullThreshold || 0.8;
  let nullCount = 0;
  let fieldCount = 0;
  
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('_')) continue;
    
    fieldCount++;
    
    if (value === null || value === undefined) {
      nullCount++;
      continue;
    }
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      if (trimmed === '' || trimmed === 'NA' || trimmed === 'NaN' || trimmed === 'null' || trimmed === 'N/A') {
        cleanedRow[key] = null;
        nullCount++;
        continue;
      }
      
      cleanedRow[key] = trimmed;
    }
    
    if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
      cleanedRow[key] = null;
      nullCount++;
      issues.push(`Invalid number in ${key}`);
    }
  }
  
  if (fieldCount > 0 && nullCount / fieldCount > nullThreshold) {
    removed = true;
    issues.push(`Too many null values (${(nullCount / fieldCount * 100).toFixed(1)}%)`);
  }
  
  if (options.removeDuplicates !== false) {
    const rowValues = Object.values(cleanedRow).filter(v => v !== null && !String(v).startsWith('_'));
    const uniqueValues = new Set(rowValues.map(v => String(v)));
    
    if (uniqueValues.size < rowValues.length * 0.1 && rowValues.length > 3) {
      issues.push('Row appears to have mostly duplicate values');
    }
  }
  
  return {
    valid: !removed && issues.length === 0,
    removed,
    issues,
    cleanedRow
  };
}

function calculateColumnCoverage(rows, columns) {
  if (!columns || columns.length === 0) return {};
  
  const coverage = {};
  
  columns.forEach(col => {
    const presentCount = rows.filter(r => r[col.name] !== null && r[col.name] !== undefined).length;
    coverage[col.name] = {
      present: presentCount,
      total: rows.length,
      percentage: rows.length > 0 ? (presentCount / rows.length * 100).toFixed(1) : 0
    };
  });
  
  return coverage;
}

function calculateQualityScore(rows, originalDataset) {
  if (rows.length === 0) return 0;
  
  let score = 100;
  
  const completenessPenalty = (1 - rows.length / originalDataset.rows.length) * 30;
  score -= completenessPenalty;
  
  let avgNullPercent = 0;
  rows.forEach(row => {
    const values = Object.entries(row).filter(([k]) => !k.startsWith('_'));
    const nullCount = values.filter(([, v]) => v === null).length;
    avgNullPercent += nullCount / values.length;
  });
  avgNullPercent /= rows.length;
  
  score -= avgNullPercent * 20;
  
  const uniqueRows = new Set(rows.map(r => JSON.stringify(Object.entries(r).filter(([k]) => !k.startsWith('_')).sort())));
  const uniquenessRatio = uniqueRows.size / rows.length;
  score -= (1 - uniquenessRatio) * 10;
  
  return Math.max(0, Math.min(100, score)).toFixed(1);
}

function filterByRelevance(rows, topicKeywords) {
  if (!topicKeywords || topicKeywords.length === 0) {
    return { filtered: rows, removed: 0 };
  }
  
  const keywordSet = new Set(topicKeywords.map(k => k.toLowerCase()));
  
  const filtered = rows.filter(row => {
    const rowText = JSON.stringify(row).toLowerCase();
    let matchCount = 0;
    
    keywordSet.forEach(keyword => {
      if (rowText.includes(keyword)) matchCount++;
    });
    
    return matchCount > 0;
  });
  
  return {
    filtered,
    removed: rows.length - filtered.length
  };
}

module.exports = { validateDataset, validateRow, calculateColumnCoverage, calculateQualityScore, filterByRelevance };
