function validate(data, schema) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return false;
  }
  
  for (const row of data) {
    for (const column of schema.columns) {
      const value = row[column.name];
      
      if (value === undefined || value === null) {
        return false;
      }
      
      const isValid = validateColumnValue(value, column);
      if (!isValid) {
        return false;
      }
    }
  }
  
  return true;
}

function validateColumnValue(value, column) {
  switch (column.type) {
    case 'integer':
      if (!Number.isInteger(value)) return false;
      if (column.range && (value < column.range[0] || value > column.range[1])) {
        return false;
      }
      break;
    
    case 'float':
      if (typeof value !== 'number' || Number.isNaN(value)) return false;
      if (column.range && (value < column.range[0] || value > column.range[1])) {
        return false;
      }
      break;
    
    case 'binary':
      if (value !== 0 && value !== 1) return false;
      break;
    
    case 'categorical':
      if (column.values && !column.values.includes(value)) return false;
      break;
  }
  
  return true;
}

function getQualityReport(data, schema) {
  const report = {
    totalRows: data.length,
    totalColumns: schema.columns.length,
    missingValues: 0,
    outOfRange: 0,
    qualityScore: 100
  };
  
  for (const row of data) {
    for (const column of schema.columns) {
      const value = row[column.name];
      
      if (value === undefined || value === null) {
        report.missingValues++;
        continue;
      }
      
      if (!validateColumnValue(value, column)) {
        report.outOfRange++;
      }
    }
  }
  
  const totalCells = data.length * schema.columns.length;
  if (totalCells > 0) {
    report.qualityScore = Math.max(0, 100 - ((report.missingValues + report.outOfRange) / totalCells) * 100);
  }
  
  return report;
}

module.exports = { validate, getQualityReport };
