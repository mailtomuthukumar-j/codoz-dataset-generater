/**
 * Merger
 * Combines multiple datasets into a unified dataset
 */

const { harmonizeSchema } = require('./normalizer');

function mergeDatasets(normalizedDatasets, options = {}) {
  if (!normalizedDatasets || normalizedDatasets.length === 0) {
    return null;
  }
  
  if (normalizedDatasets.length === 1) {
    return {
      rows: normalizedDatasets[0].rows,
      schema: normalizedDatasets[0].schema,
      merged: false,
      sources: [normalizedDatasets[0].source]
    };
  }
  
  const schemaInfo = harmonizeSchema(normalizedDatasets);
  
  const mergedRows = [];
  
  normalizedDatasets.forEach(dataset => {
    dataset.rows.forEach(row => {
      const mergedRow = alignRowToSchema(row, schemaInfo.unifiedSchema);
      mergedRows.push(mergedRow);
    });
  });
  
  return {
    rows: mergedRows,
    schema: {
      columns: schemaInfo.unifiedSchema.map(col => ({ name: col, source: 'merged' })),
      rowCount: mergedRows.length
    },
    merged: true,
    sources: normalizedDatasets.map(d => d.source),
    sourceCount: normalizedDatasets.length,
    schemaInfo
  };
}

function alignRowToSchema(row, unifiedSchema) {
  const aligned = { ...row };
  
  aligned._source = row._source || 'unknown';
  aligned._sourceId = row._sourceId || 'unknown';
  
  return aligned;
}

function mergeWithDeduplication(normalizedDatasets, options = {}) {
  const merged = mergeDatasets(normalizedDatasets, options);
  
  if (!merged || merged.rows.length === 0) {
    return merged;
  }
  
  const seen = new Map();
  const deduplicated = [];
  
  merged.rows.forEach(row => {
    const key = generateRowKey(row);
    
    if (!seen.has(key)) {
      seen.set(key, deduplicated.length);
      deduplicated.push(row);
    }
  });
  
  return {
    ...merged,
    rows: deduplicated,
    originalCount: merged.rows.length,
    deduplicatedCount: deduplicated.length,
    duplicatesRemoved: merged.rows.length - deduplicated.length
  };
}

function generateRowKey(row) {
  const relevantFields = Object.entries(row)
    .filter(([key]) => !key.startsWith('_'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  
  return relevantFields;
}

function sampleFromMerged(mergedDataset, targetSize) {
  if (!mergedDataset || !mergedDataset.rows) {
    return null;
  }
  
  const rows = mergedDataset.rows;
  
  if (rows.length <= targetSize) {
    return {
      ...mergedDataset,
      sampled: false,
      sampledSize: rows.length
    };
  }
  
  const shuffled = [...rows].sort(() => Math.random() - 0.5);
  const sampled = shuffled.slice(0, targetSize);
  
  return {
    ...mergedDataset,
    rows: sampled,
    sampled: true,
    sampledSize: targetSize,
    originalSize: rows.length
  };
}

module.exports = { mergeDatasets, mergeWithDeduplication, sampleFromMerged };
