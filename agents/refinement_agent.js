function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function process(context) {
  const dataset = [...context.dataset];
  const validation_report = context.validation_report;
  const schema = context.schema;
  const constraints = schema?.constraints || [];
  const refinement_cycle = (context.refinement_cycle || 0) + 1;
  
  if (refinement_cycle > 3) {
    return {
      ...context,
      dataset,
      refinement_cycle,
      logs: [...context.logs, {
        timestamp: new Date().toISOString(),
        event: 'refinement_max_cycles',
        data: { cycles: refinement_cycle }
      }]
    };
  }
  
  if (!validation_report || !validation_report.failures || validation_report.failures.length === 0) {
    return {
      ...context,
      dataset,
      refinement_cycle,
      patches_applied: 0,
      rows_affected: [],
      logs: [...context.logs, {
        timestamp: new Date().toISOString(),
        event: 'refinement_complete',
        data: { patches: 0 }
      }]
    };
  }
  
  const sortedFailures = [...validation_report.failures].sort((a, b) => a.score - b.score);
  let patchesApplied = 0;
  const rowsAffected = new Set();
  
  for (const failure of sortedFailures) {
    const result = applyFix(dataset, failure, schema, constraints, context.seed);
    dataset.length = 0;
    dataset.push(...result.patched);
    patchesApplied += result.patches;
    result.affectedRows.forEach(r => rowsAffected.add(r));
  }
  
  return {
    ...context,
    dataset,
    refinement_cycle,
    patches_applied: patchesApplied,
    rows_affected: Array.from(rowsAffected),
    logs: [...context.logs, {
      timestamp: new Date().toISOString(),
      event: 'refinement_complete',
      data: { patches: patchesApplied, rows: rowsAffected.size, cycle: refinement_cycle }
    }]
  };
}

function applyFix(dataset, failure, schema, constraints, baseSeed) {
  const patched = [];
  const affectedRows = [];
  let patches = 0;
  
  switch (failure.check) {
    case 'schema_conformance':
      for (let i = 0; i < dataset.length; i++) {
        const row = fixSchemaConformance(dataset[i], schema);
        if (row !== dataset[i]) {
          patches++;
          affectedRows.push(i);
        }
        patched.push(row);
      }
      break;
    
    case 'range_compliance':
      for (let i = 0; i < dataset.length; i++) {
        const row = fixRangeCompliance(dataset[i], schema);
        if (JSON.stringify(row) !== JSON.stringify(dataset[i])) {
          patches++;
          affectedRows.push(i);
        }
        patched.push(row);
      }
      break;
    
    case 'category_compliance':
      for (let i = 0; i < dataset.length; i++) {
        const row = fixCategoryCompliance(dataset[i], schema);
        if (JSON.stringify(row) !== JSON.stringify(dataset[i])) {
          patches++;
          affectedRows.push(i);
        }
        patched.push(row);
      }
      break;
    
    case 'duplicate_rate':
      const seen = new Set();
      const duplicates = [];
      
      for (let i = 0; i < dataset.length; i++) {
        const hash = JSON.stringify(dataset[i]);
        if (seen.has(hash)) {
          duplicates.push(i);
        } else {
          seen.add(hash);
        }
      }
      
      for (let i = 0; i < dataset.length; i++) {
        if (duplicates.includes(i)) {
          const newRow = regenerateRow(schema, constraints, i, baseSeed);
          patched.push(newRow);
          patches++;
          affectedRows.push(i);
        } else {
          patched.push(dataset[i]);
        }
      }
      break;
    
    case 'label_distribution':
      const targetCol = schema?.columns?.find(c => c.is_target);
      if (targetCol) {
        const targetValues = targetCol.categories || [0, 1];
        const distribution = context.label_distribution || {};
        
        const desiredCounts = {};
        for (const [label, ratio] of Object.entries(distribution)) {
          desiredCounts[label] = Math.round(ratio * dataset.length);
        }
        
        const currentCounts = {};
        for (const row of dataset) {
          const label = String(row[targetCol.name]);
          currentCounts[label] = (currentCounts[label] || 0) + 1;
        }
        
        let idx = 0;
        for (const [label, desired] of Object.entries(desiredCounts)) {
          const current = currentCounts[label] || 0;
          const excess = current - desired;
          
          if (excess > 0) {
            for (let i = 0; i < excess && idx < dataset.length; i++) {
              if (String(dataset[idx][targetCol.name]) === label) {
                const otherLabels = Object.keys(desiredCounts).filter(l => l !== label);
                if (otherLabels.length > 0) {
                  const newLabel = otherLabels[Math.floor(Math.random() * otherLabels.length)];
                  patched.push({ ...dataset[idx], [targetCol.name]: newLabel });
                  patches++;
                  affectedRows.push(idx);
                  idx++;
                  continue;
                }
              }
              patched.push(dataset[idx]);
              idx++;
            }
          } else {
            while (idx < dataset.length && patched.length < dataset.length) {
              patched.push(dataset[idx]);
              idx++;
            }
          }
        }
        
        while (idx < dataset.length && patched.length < dataset.length) {
          patched.push(dataset[idx]);
          idx++;
        }
      }
      break;
    
    default:
      for (let i = 0; i < dataset.length; i++) {
        patched.push(dataset[i]);
      }
  }
  
  return { patched, patches, affectedRows };
}

function fixSchemaConformance(row, schema) {
  const fixed = {};
  const schemaCols = new Set(schema.columns.map(c => c.name));
  
  for (const col of schema.columns) {
    if (col.name in row) {
      fixed[col.name] = row[col.name];
    } else {
      fixed[col.name] = getDefaultValue(col);
    }
  }
  
  return fixed;
}

function fixRangeCompliance(row, schema) {
  const fixed = { ...row };
  
  for (const col of schema.columns) {
    if (col.range && (col.dtype === 'int' || col.dtype === 'float')) {
      const value = row[col.name];
      if (typeof value === 'number') {
        let clamped = Math.max(col.range[0], Math.min(col.range[1], value));
        if (col.dtype === 'int') {
          clamped = Math.round(clamped);
        } else {
          clamped = parseFloat(clamped.toFixed(2));
        }
        fixed[col.name] = clamped;
      }
    }
  }
  
  return fixed;
}

function fixCategoryCompliance(row, schema) {
  const fixed = { ...row };
  
  for (const col of schema.columns) {
    if (col.categories && col.categories.length > 0) {
      const value = row[col.name];
      if (!col.categories.includes(value)) {
        const closest = findClosestCategory(value, col.categories);
        fixed[col.name] = closest;
      }
    }
  }
  
  return fixed;
}

function findClosestCategory(value, categories) {
  if (typeof value === 'string') {
    const lowerCategories = categories.map(c => c.toLowerCase());
    const lowerValue = value.toLowerCase();
    
    for (let i = 0; i < categories.length; i++) {
      if (lowerCategories[i].includes(lowerValue) || lowerValue.includes(lowerCategories[i])) {
        return categories[i];
      }
    }
  }
  
  return categories[0];
}

function regenerateRow(schema, constraints, index, baseSeed) {
  const row = {};
  const seed = baseSeed + index * 1000 + Date.now() % 1000;
  
  for (const col of schema.columns) {
    row[col.name] = generateValue(col, seed, index);
  }
  
  return row;
}

function generateValue(column, seed, index) {
  const rand = () => seededRandom(seed + index * 100 + hashString(column.name));
  
  switch (column.dtype) {
    case 'int': {
      const [min, max] = column.range || [0, 100];
      return Math.round(min + rand() * (max - min));
    }
    
    case 'float': {
      const [min, max] = column.range || [0, 100];
      return parseFloat((min + rand() * (max - min)).toFixed(2));
    }
    
    case 'categorical':
    case 'ordinal': {
      const values = column.categories || ['A', 'B', 'C'];
      return values[Math.floor(rand() * values.length)];
    }
    
    case 'boolean':
      return rand() > 0.5;
    
    case 'datetime': {
      const start = new Date('2020-01-01').getTime();
      const end = new Date('2024-12-31').getTime();
      return new Date(start + rand() * (end - start)).toISOString();
    }
    
    default:
      return null;
  }
}

function getDefaultValue(column) {
  switch (column.dtype) {
    case 'int':
    case 'float':
      return column.range ? (column.range[0] + column.range[1]) / 2 : 0;
    case 'categorical':
    case 'ordinal':
      return column.categories?.[0] || 'Unknown';
    case 'boolean':
      return false;
    default:
      return null;
  }
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

module.exports = { process };
