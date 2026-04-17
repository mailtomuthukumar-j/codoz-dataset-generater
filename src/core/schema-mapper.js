/**
 * Schema Mapper
 * Maps generic/unnamed columns to proper domain-specific names
 * Enforces professional dataset standards (Kaggle-level quality)
 */

const logger = require('../utils/logger');

const SCHEMA_MAPPINGS = {
  'pima-indians-diabetes': {
    source: 'uci',
    description: 'Pima Indians Diabetes Dataset',
    columnMapping: {
      'col_1': 'pregnancy_count',
      'col_2': 'glucose_concentration',
      'col_3': 'blood_pressure_diastolic',
      'col_4': 'triceps_skinfold_thickness',
      'col_5': 'insulin_level',
      'col_6': 'bmi',
      'col_7': 'pedigree_diabetes_function',
      'col_8': 'age',
      'col_9': 'diabetes_diagnosis',
      '1': 'pregnancy_count',
      '2': 'glucose_concentration',
      '3': 'blood_pressure_diastolic',
      '4': 'triceps_skinfold_thickness',
      '5': 'insulin_level',
      '6': 'bmi',
      '7': 'pedigree_diabetes_function',
      '8': 'age',
      '9': 'diabetes_diagnosis',
      'pregnancies': 'pregnancy_count',
      'glucose': 'glucose_concentration',
      'bloodpressure': 'blood_pressure_diastolic',
      'skinthickness': 'triceps_skinfold_thickness',
      'insulin': 'insulin_level',
      'bmi': 'bmi',
      'diabetespedigreefunction': 'pedigree_diabetes_function',
      'outcome': 'diabetes_diagnosis'
    },
    properNames: {
      age: 'Age (years)',
      pregnancy_count: 'Number of Pregnancies',
      glucose_concentration: 'Plasma Glucose Concentration',
      blood_pressure_diastolic: 'Diastolic Blood Pressure (mm Hg)',
      triceps_skinfold_thickness: 'Triceps Skin Fold Thickness (mm)',
      insulin_level: '2-Hour Serum Insulin (mu U/ml)',
      bmi: 'Body Mass Index (weight/height in kg/m2)',
      pedigree_diabetes_function: 'Diabetes Pedigree Function',
      diabetes_diagnosis: 'Class Variable (0=negative, 1=positive)'
    },
    constraints: {
      age: { min: 21, max: 81, type: 'integer' },
      pregnancy_count: { min: 0, max: 17, type: 'integer' },
      glucose_concentration: { min: 44, max: 199, type: 'float' },
      blood_pressure_diastolic: { min: 24, max: 122, type: 'integer' },
      triceps_skinfold_thickness: { min: 7, max: 63, type: 'integer' },
      insulin_level: { min: 14, max: 846, type: 'float' },
      bmi: { min: 15.0, max: 67.1, type: 'float' },
      pedigree_diabetes_function: { min: 0.078, max: 2.42, type: 'float' },
      diabetes_diagnosis: { min: 0, max: 1, type: 'integer' }
    }
  },
  'heart-disease': {
    source: 'uci',
    description: 'Cleveland Heart Disease Dataset',
    columnMapping: {
      'col_1': 'age',
      'col_2': 'gender',
      'col_3': 'chest_pain_type',
      'col_4': 'resting_blood_pressure',
      'col_5': 'serum_cholesterol',
      'col_6': 'fasting_blood_sugar',
      'col_7': 'resting_ecg',
      'col_8': 'maximum_heart_rate',
      'col_9': 'exercise_induced_angina',
      'col_10': 'st_depression',
      'col_11': 'exercise_st_slope',
      'col_12': 'major_vessels_colored',
      'col_13': 'thalassemia',
      'col_14': 'heart_disease_present',
      'age': 'age',
      'sex': 'gender',
      'cp': 'chest_pain_type',
      'trestbps': 'resting_blood_pressure',
      'chol': 'serum_cholesterol',
      'fbs': 'fasting_blood_sugar',
      'restecg': 'resting_ecg',
      'thalach': 'maximum_heart_rate',
      'exang': 'exercise_induced_angina',
      'oldpeak': 'st_depression',
      'slope': 'exercise_st_slope',
      'ca': 'major_vessels_colored',
      'thal': 'thalassemia',
      'target': 'heart_disease_present'
    },
    properNames: {
      age: 'Age (years)',
      gender: 'Sex (1=male, 0=female)',
      chest_pain_type: 'Chest Pain Type',
      resting_blood_pressure: 'Resting Blood Pressure (mm Hg)',
      serum_cholesterol: 'Serum Cholesterol (mg/dl)',
      fasting_blood_sugar: 'Fasting Blood Sugar > 120 mg/dl',
      resting_ecg: 'Resting Electrocardiographic Results',
      maximum_heart_rate: 'Maximum Heart Rate Achieved',
      exercise_induced_angina: 'Exercise Induced Angina',
      st_depression: 'ST Depression Induced by Exercise',
      exercise_st_slope: 'Slope of Peak Exercise ST Segment',
      major_vessels_colored: 'Number of Major Vessels Colored by Fluoroscopy',
      thalassemia: 'Thalassemia',
      heart_disease_present: 'Diagnosis of Heart Disease'
    },
    constraints: {
      age: { min: 29, max: 77, type: 'integer' },
      gender: { values: [0, 1], type: 'categorical' },
      chest_pain_type: { values: [1, 2, 3, 4], type: 'categorical' },
      resting_blood_pressure: { min: 94, max: 200, type: 'integer' },
      serum_cholesterol: { min: 126, max: 564, type: 'integer' },
      fasting_blood_sugar: { values: [0, 1], type: 'categorical' },
      resting_ecg: { values: [0, 1, 2], type: 'categorical' },
      maximum_heart_rate: { min: 71, max: 202, type: 'integer' },
      exercise_induced_angina: { values: [0, 1], type: 'categorical' },
      st_depression: { min: 0, max: 6.2, type: 'float' },
      exercise_st_slope: { values: [1, 2, 3], type: 'categorical' },
      major_vessels_colored: { min: 0, max: 3, type: 'integer' },
      thalassemia: { values: [3, 6, 7], type: 'categorical' },
      heart_disease_present: { values: [0, 1, 2, 3, 4], type: 'categorical' }
    }
  },
  'iris': {
    source: 'uci',
    description: 'Iris Flower Dataset',
    columnMapping: {
      'col_1': 'sepal_length',
      'col_2': 'sepal_width',
      'col_3': 'petal_length',
      'col_4': 'petal_width',
      'col_5': 'species'
    },
    properNames: {
      sepal_length: 'Sepal Length (cm)',
      sepal_width: 'Sepal Width (cm)',
      petal_length: 'Petal Length (cm)',
      petal_width: 'Petal Width (cm)',
      species: 'Species (setosa, versicolor, virginica)'
    },
    constraints: {
      sepal_length: { min: 4.3, max: 7.9, type: 'float' },
      sepal_width: { min: 2.0, max: 4.4, type: 'float' },
      petal_length: { min: 1.0, max: 6.9, type: 'float' },
      petal_width: { min: 0.1, max: 2.5, type: 'float' },
      species: { values: ['setosa', 'versicolor', 'virginica'], type: 'categorical' }
    }
  },
  'wine': {
    source: 'uci',
    description: 'Wine Recognition Dataset',
    columnMapping: {
      'col_1': 'wine_class',
      'col_2': 'alcohol',
      'col_3': 'malic_acid',
      'col_4': 'ash',
      'col_5': 'alcalinity_ash',
      'col_6': 'magnesium',
      'col_7': 'phenols_total',
      'col_8': 'flavanoids',
      'col_9': 'nonflavanoid_phenols',
      'col_10': 'proanthocyanins',
      'col_11': 'color_intensity',
      'col_12': 'hue',
      'col_13': 'od280_od315',
      'col_14': 'proline'
    },
    properNames: {
      wine_class: 'Wine Class (1, 2, 3)',
      alcohol: 'Alcohol',
      malic_acid: 'Malic Acid',
      ash: 'Ash',
      alcalinity_ash: 'Alcalinity of Ash',
      magnesium: 'Magnesium',
      phenols_total: 'Total Phenols',
      flavanoids: 'Flavanoids',
      nonflavanoid_phenols: 'Nonflavanoid Phenols',
      proanthocyanins: 'Proanthocyanins',
      color_intensity: 'Color Intensity',
      hue: 'Hue',
      od280_od315: 'OD280/OD315 of Diluted Wines',
      proline: 'Proline'
    },
    constraints: {
      wine_class: { min: 1, max: 3, type: 'integer' },
      alcohol: { min: 11.03, max: 14.83, type: 'float' },
      malic_acid: { min: 0.74, max: 5.80, type: 'float' },
      ash: { min: 1.36, max: 3.23, type: 'float' },
      alcalinity_ash: { min: 10.6, max: 30.0, type: 'float' },
      magnesium: { min: 70, max: 162, type: 'integer' },
      phenols_total: { min: 0.98, max: 3.88, type: 'float' },
      flavanoids: { min: 0.34, max: 5.08, type: 'float' },
      nonflavanoid_phenols: { min: 0.13, max: 0.66, type: 'float' },
      proanthocyanins: { min: 0.66, max: 3.58, type: 'float' },
      color_intensity: { min: 1.28, max: 13.0, type: 'float' },
      hue: { min: 0.48, max: 1.71, type: 'float' },
      od280_od315: { min: 1.73, max: 4.00, type: 'float' },
      proline: { min: 278, max: 1680, type: 'integer' }
    }
  },
  'breast-cancer-wisconsin': {
    source: 'uci',
    description: 'Breast Cancer Wisconsin Dataset',
    columnMapping: {
      'col_1': 'sample_id',
      'col_2': 'clump_thickness',
      'col_3': 'cell_size_uniformity',
      'col_4': 'cell_shape_uniformity',
      'col_5': 'marginal_adhesion',
      'col_6': 'single_epithelial_cell_size',
      'col_7': 'bare_nuclei',
      'col_8': 'bland_chromatin',
      'col_9': 'normal_nucleoli',
      'col_10': 'mitoses',
      'col_11': 'diagnosis'
    },
    properNames: {
      sample_id: 'Sample ID',
      clump_thickness: 'Clump Thickness',
      cell_size_uniformity: 'Cell Size Uniformity',
      cell_shape_uniformity: 'Cell Shape Uniformity',
      marginal_adhesion: 'Marginal Adhesion',
      single_epithelial_cell_size: 'Single Epithelial Cell Size',
      bare_nuclei: 'Bare Nuclei',
      bland_chromatin: 'Bland Chromatin',
      normal_nucleoli: 'Normal Nucleoli',
      mitoses: 'Mitoses',
      diagnosis: 'Diagnosis (2=benign, 4=malignant)'
    },
    constraints: {
      clump_thickness: { min: 1, max: 10, type: 'integer' },
      cell_size_uniformity: { min: 1, max: 10, type: 'integer' },
      cell_shape_uniformity: { min: 1, max: 10, type: 'integer' },
      marginal_adhesion: { min: 1, max: 10, type: 'integer' },
      single_epithelial_cell_size: { min: 1, max: 10, type: 'integer' },
      bare_nuclei: { min: 1, max: 10, type: 'integer' },
      bland_chromatin: { min: 1, max: 10, type: 'integer' },
      normal_nucleoli: { min: 1, max: 10, type: 'integer' },
      mitoses: { min: 1, max: 10, type: 'integer' },
      diagnosis: { values: [2, 4], type: 'categorical' }
    }
  }
};

const GENERIC_COLUMN_PATTERNS = [
  /^col_\d+$/,
  /^column\d+$/,
  /^field\d+$/,
  /^feature\d+$/,
  /^var\d+$/,
  /^x\d+$/,
  /^attr\d+$/
];

function isGenericColumnName(name) {
  return GENERIC_COLUMN_PATTERNS.some(pattern => pattern.test(name));
}

function getSchemaMapping(datasetId) {
  const normalizedId = datasetId.toLowerCase().replace(/[-_\s]/g, '');
  
  for (const [key, mapping] of Object.entries(SCHEMA_MAPPINGS)) {
    if (normalizedId.includes(key.toLowerCase().replace(/-/g, ''))) {
      return mapping;
    }
  }
  
  return null;
}

function applySchemaMapping(rows, datasetId) {
  const mapping = getSchemaMapping(datasetId);
  
  if (!mapping) {
    logger.debug(`No schema mapping found for: ${datasetId}`);
    return rows;
  }
  
  logger.info(`Applying schema mapping for: ${datasetId}`);
  
  const mappedRows = rows.map(row => {
    const newRow = {};
    
    for (const [key, value] of Object.entries(row)) {
      let mappedKey = mapping.columnMapping[key] || key;
      let finalValue = value;
      
      finalValue = handleZeroAsMissing(mappedKey, value, datasetId);
      
      newRow[mappedKey] = finalValue;
    }
    
    if (!newRow.id && !newRow.sample_id && !newRow.patient_id) {
      newRow.id = `sample_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return newRow;
  });
  
  return mappedRows;
}

function handleZeroAsMissing(columnName, value, datasetId) {
  if (value === 0 || value === '0') {
    const zeroAsMissingColumns = {
      'pima-indians-diabetes': ['glucose_concentration', 'blood_pressure_diastolic', 'triceps_skinfold_thickness', 'insulin_level', 'bmi'],
      'heart-disease': ['resting_blood_pressure', 'serum_cholesterol'],
      'breast-cancer-wisconsin': ['bare_nuclei']
    };
    
    const normalizedId = datasetId.toLowerCase().replace(/[-_\s]/g, '');
    const columns = zeroAsMissingColumns[datasetId] || zeroAsMissingColumns[Object.keys(zeroAsMissingColumns).find(k => normalizedId.includes(k.toLowerCase().replace(/-/g, '')))] || [];
    
    if (columns.includes(columnName)) {
      return null;
    }
  }
  
  return value;
}

function validateColumnNames(rows) {
  const invalidRows = [];
  
  rows.forEach((row, index) => {
    const genericColumns = Object.keys(row).filter(key => isGenericColumnName(key));
    
    if (genericColumns.length > 0) {
      invalidRows.push({
        rowIndex: index,
        genericColumns
      });
    }
  });
  
  return {
    valid: invalidRows.length === 0,
    invalidRows
  };
}

function getProperColumnName(originalName, datasetId) {
  const mapping = getSchemaMapping(datasetId);
  
  if (mapping && mapping.columnMapping[originalName]) {
    return mapping.columnMapping[originalName];
  }
  
  if (mapping && mapping.properNames[originalName]) {
    return originalName;
  }
  
  return originalName;
}

function getColumnDescription(columnName, datasetId) {
  const mapping = getSchemaMapping(datasetId);
  
  if (mapping && mapping.properNames[columnName]) {
    return mapping.properNames[columnName];
  }
  
  return null;
}

function getConstraints(columnName, datasetId) {
  const mapping = getSchemaMapping(datasetId);
  
  if (mapping && mapping.constraints && mapping.constraints[columnName]) {
    return mapping.constraints[columnName];
  }
  
  return null;
}

function getAllSchemaInfo(datasetId) {
  const mapping = getSchemaMapping(datasetId);
  
  if (!mapping) {
    return null;
  }
  
  return {
    datasetId,
    description: mapping.description,
    source: mapping.source,
    columns: mapping.columnMapping ? Object.keys(mapping.columnMapping) : [],
    properNames: mapping.properNames,
    constraints: mapping.constraints
  };
}

module.exports = {
  SCHEMA_MAPPINGS,
  isGenericColumnName,
  getSchemaMapping,
  applySchemaMapping,
  validateColumnNames,
  getProperColumnName,
  getColumnDescription,
  getConstraints,
  getAllSchemaInfo
};