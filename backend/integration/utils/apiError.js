class IntegrationApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "IntegrationApiError";
    this.statusCode = options.statusCode || 500;
    this.code = options.code || "INTEGRATION_ERROR";
    this.details = options.details;
    this.cause = options.cause;
  }
}

module.exports = IntegrationApiError;
