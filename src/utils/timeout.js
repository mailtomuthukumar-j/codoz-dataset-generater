/**
 * Timeout Utility
 * Wraps functions with timeout
 */

function withTimeout(promise, ms, errorMsg = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), ms)
    )
  ]);
}

module.exports = { withTimeout };