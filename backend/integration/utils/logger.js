const maskHeaders = (headers = {}) => {
  const masked = { ...headers };

  ["authorization", "x-api-key", "x-webhook-secret"].forEach((key) => {
    if (masked[key]) masked[key] = "***";
  });

  return masked;
};

const truncate = (value) => {
  if (value === undefined) return undefined;

  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) return value;

  return text.length > 2000 ? `${text.slice(0, 2000)}...` : value;
};

const integrationLogger = {
  request: (config) => {
    console.log("[CRM-ERP Integration] Request", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL || ""}${config.url || ""}`,
      headers: maskHeaders(config.headers),
      body: truncate(config.data),
    });
  },

  response: (response) => {
    console.log("[CRM-ERP Integration] Response", {
      status: response.status,
      url: response.config?.url,
      method: response.config?.method?.toUpperCase(),
      body: truncate(response.data),
    });
  },

  error: (error) => {
    console.error("[CRM-ERP Integration] Error", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    });
  },
};

module.exports = integrationLogger;
