const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  if (!error.response) return true;
  return [408, 429, 500, 502, 503, 504].includes(error.response.status);
};

const withRetry = async (operation, options = {}) => {
  const attempts = Math.max(Number(options.attempts || 1), 1);
  const delayMs = Math.max(Number(options.delayMs || 0), 0);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !isRetryableError(error)) {
        throw error;
      }

      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
};

module.exports = withRetry;
