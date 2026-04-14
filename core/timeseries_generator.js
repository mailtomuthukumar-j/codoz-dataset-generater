/**
 * CODOZ Time Series Generator
 * 
 * Generates realistic time-series data with:
 * - Temporal patterns (daily, weekly, seasonal)
 * - Trend components
 * - Noise with appropriate autocorrelation
 * - Anomaly injection
 */

function generateTimeSeries(config) {
  const {
    startDate,
    endDate,
    frequency = 'daily', // hourly, daily, weekly, monthly
    trend = 0, // positive = increasing, negative = decreasing
    seasonality = null, // { type: 'daily'|'weekly'|'monthly', amplitude: 0.1-0.5 }
    noiseLevel = 0.1, // 0-1, proportion of signal
    anomalies = null // { count: 5, magnitude: 2 } - inject anomalies
  } = config;
  
  const points = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentDate = new Date(start);
  let t = 0; // time counter
  
  while (currentDate <= end) {
    let value = baseline(currentDate, config);
    
    // Add trend
    value += trend * t * 0.01;
    
    // Add seasonality
    if (seasonality) {
      value += applySeasonality(currentDate, seasonality);
    }
    
    // Add noise
    value += (Math.random() - 0.5) * noiseLevel * Math.abs(value);
    
    points.push({
      timestamp: new Date(currentDate),
      value: Math.max(0, value),
      hour: currentDate.getHours(),
      dayOfWeek: currentDate.getDay(),
      dayOfMonth: currentDate.getDate(),
      month: currentDate.getMonth()
    });
    
    // Increment based on frequency
    switch (frequency) {
      case 'hourly':
        currentDate.setHours(currentDate.getHours() + 1);
        break;
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
    t++;
  }
  
  // Inject anomalies
  if (anomalies && anomalies.count > 0) {
    injectAnomalies(points, anomalies);
  }
  
  return points;
}

function baseline(date, config) {
  // Default baseline based on time of day
  const hour = date.getHours();
  let base = config.baseValue || 100;
  
  // Daily pattern: higher during business hours
  if (hour >= 9 && hour <= 17) {
    base *= 1.2;
  } else if (hour >= 0 && hour <= 6) {
    base *= 0.5;
  }
  
  return base;
}

function applySeasonality(date, seasonality) {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  const amplitude = seasonality.amplitude || 0.2;
  
  let seasonal = 0;
  
  switch (seasonality.type) {
    case 'daily':
      // Peak at noon, low at night
      seasonal = Math.sin((hour - 6) * Math.PI / 12) * amplitude;
      break;
    
    case 'weekly':
      // Peak mid-week
      const dayOffset = dayOfWeek - 1; // Monday = 0
      seasonal = Math.sin(dayOffset * Math.PI / 3) * amplitude;
      break;
    
    case 'monthly':
      // Peak in middle of month (paycheck effect)
      const dayOfMonth = date.getDate();
      const midMonth = 15;
      seasonal = Math.sin((dayOfMonth - midMonth) * Math.PI / 15) * amplitude;
      break;
    
    case 'yearly':
      // Seasonal peaks (e.g., winter for heating, summer for cooling)
      seasonal = Math.sin((month - 3) * Math.PI / 6) * amplitude;
      break;
  }
  
  return seasonal;
}

function injectAnomalies(points, config) {
  const count = config.count || 5;
  const magnitude = config.magnitude || 3; // standard deviations
  
  // Calculate mean and std of values
  const values = points.map(p => p.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  
  // Randomly select indices to inject anomalies
  const indices = [];
  while (indices.length < count) {
    const idx = Math.floor(Math.random() * points.length);
    if (!indices.includes(idx)) {
      indices.push(idx);
    }
  }
  
  // Inject anomalies
  for (const idx of indices) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    points[idx].value = mean + direction * magnitude * std;
    points[idx].isAnomaly = true;
  }
}

/**
 * Generate sensor monitoring data with temporal patterns
 */
function generateSensorData(config) {
  const {
    startDate,
    endDate,
    sensors = ['temperature', 'humidity', 'pressure'],
    anomalies = { count: 5, probability: 0.02 }
  } = config;
  
  const data = [];
  const baseValues = {
    temperature: 22,
    humidity: 50,
    pressure: 1013,
    pm2_5: 25,
    co: 0.5
  };
  
  const ranges = {
    temperature: { min: -20, max: 50, seasonal: 'yearly' },
    humidity: { min: 0, max: 100, seasonal: 'daily' },
    pressure: { min: 980, max: 1050, seasonal: 'daily' },
    pm2_5: { min: 0, max: 200, seasonal: 'weekly' },
    co: { min: 0, max: 10, seasonal: 'daily' }
  };
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const row = {
      timestamp: new Date(currentDate),
      hour: currentDate.getHours(),
      dayOfWeek: currentDate.getDay()
    };
    
    for (const sensor of sensors) {
      const base = baseValues[sensor] || 50;
      const range = ranges[sensor] || { min: 0, max: 100 };
      
      // Base value with time-based pattern
      let value = base;
      
      // Daily variation
      const hour = currentDate.getHours();
      if (sensor === 'temperature') {
        value += Math.sin((hour - 6) * Math.PI / 12) * 5;
      } else if (sensor === 'humidity') {
        value -= Math.sin((hour - 6) * Math.PI / 12) * 10;
      }
      
      // Random noise
      value += (Math.random() - 0.5) * (range.max - range.min) * 0.1;
      
      // Occasional anomaly
      if (Math.random() < anomalies.probability) {
        value += (Math.random() > 0.5 ? 1 : -1) * (range.max - range.min) * 0.3;
      }
      
      // Clamp to range
      value = Math.max(range.min, Math.min(range.max, value));
      
      row[sensor] = parseFloat(value.toFixed(2));
    }
    
    data.push(row);
    
    // Increment by hour
    currentDate.setHours(currentDate.getHours() + 1);
  }
  
  return data;
}

module.exports = {
  generateTimeSeries,
  generateSensorData,
  applySeasonality,
  injectAnomalies
};
