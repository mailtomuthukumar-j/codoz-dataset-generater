/**
 * Retry Utility
 * Handles failed API calls with exponential backoff
 */

async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry = null
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );
        
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, error.message, delay);
        }
        
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

function isNonRetryableError(error) {
  const nonRetryable = [
    '401',
    '403',
    '404',
    '422',
    'No data',
    'No CSV',
    'Dataset not found',
    'No CSV file found'
  ];
  
  return nonRetryable.some(msg => 
    error.message && error.message.includes(msg)
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { retry, sleep };