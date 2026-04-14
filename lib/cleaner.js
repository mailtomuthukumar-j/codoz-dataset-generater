function process(data, schema) {
  const cleaned = data.map(row => {
    const cleanedRow = {};
    
    for (const column of schema.columns) {
      let value = row[column.name];
      
      if (value === undefined || value === null || value === '') {
        switch (column.type) {
          case 'integer':
          case 'float':
            value = (column.range[0] + column.range[1]) / 2;
            break;
          case 'categorical':
            value = column.values[0];
            break;
          case 'binary':
            value = 0;
            break;
          default:
            value = null;
        }
      }
      
      if (column.type === 'float' && typeof value === 'number') {
        value = parseFloat(value.toFixed(2));
      }
      
      cleanedRow[column.name] = value;
    }
    
    return cleanedRow;
  });
  
  return cleaned;
}

module.exports = { process };
