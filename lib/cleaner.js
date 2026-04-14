function process(data, schema) {
  return data.map(row => {
    const cleaned = {};
    
    for (const column of schema.columns) {
      let value = row[column.name];
      
      if (value === undefined || value === null || value === '') {
        value = getDefaultValue(column);
      }
      
      if (typeof value === 'number' && !Number.isInteger(value)) {
        value = parseFloat(value.toFixed(2));
      }
      
      cleaned[column.name] = value;
    }
    
    return cleaned;
  });
}

function getDefaultValue(column) {
  switch (column.type) {
    case 'integer':
    case 'float':
      if (column.range) {
        return (column.range[0] + column.range[1]) / 2;
      }
      return 50;
    
    case 'categorical':
      return column.values?.[0] || 'Unknown';
    
    case 'binary':
      return 0;
    
    case 'id':
      return `ID${Date.now()}`;
    
    default:
      return null;
  }
}

module.exports = { process };
