const axios = require("axios");
const integrationConfig = require("../config/integrationConfig");
const IntegrationApiError = require("../utils/apiError");
const integrationLogger = require("../utils/logger");
const withRetry = require("../utils/retry");

const replacePathParams = (path, params = {}) =>
  Object.entries(params).reduce(
    (nextPath, [key, value]) =>
      nextPath.replace(`:${key}`, encodeURIComponent(String(value))),
    path
  );

const createClient = () => {
  if (!integrationConfig.erp.baseUrl) {
    throw new IntegrationApiError("ERP_BASE_URL is not configured", {
      statusCode: 500,
      code: "ERP_BASE_URL_MISSING",
    });
  }

  const client = axios.create({
    baseURL: integrationConfig.erp.baseUrl,
    timeout: integrationConfig.erp.timeoutMs,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": integrationConfig.erp.apiKey,
      "x-webhook-secret": integrationConfig.erp.webhookSecret,
    },
  });

  client.interceptors.request.use((config) => {
    integrationLogger.request(config);
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      integrationLogger.response(response);
      return response;
    },
    (error) => {
      integrationLogger.error(error);
      return Promise.reject(error);
    }
  );

  return client;
};

const normalizeAxiosError = (error) => {
  if (error instanceof IntegrationApiError) return error;

  if (error.code === "ECONNABORTED") {
    return new IntegrationApiError(
      `ERP API request timed out after ${integrationConfig.erp.timeoutMs}ms`,
      {
        statusCode: 504,
        code: "ERP_API_TIMEOUT",
        details: {
          method: error.config?.method?.toUpperCase(),
          url: `${error.config?.baseURL || ""}${error.config?.url || ""}`,
          timeoutMs: integrationConfig.erp.timeoutMs,
        },
        cause: error,
      }
    );
  }

  return new IntegrationApiError(
    error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "ERP API request failed",
    {
      statusCode: error.response?.status || 502,
      code: "ERP_API_REQUEST_FAILED",
      details: error.response?.data,
      cause: error,
    }
  );
};

const request = async (config) => {
  try {
    const client = createClient();
    const response = await withRetry(() => client.request(config), {
      attempts: integrationConfig.erp.retryAttempts,
      delayMs: integrationConfig.erp.retryDelayMs,
    });

    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
};

const erpApiClient = {
  sendInvitation: (payload) =>
    request({
      method: "post",
      url: integrationConfig.erp.endpoints.invitations,
      data: payload,
    }),

  createCustomer: (payload) =>
    request({
      method: "post",
      url: integrationConfig.erp.endpoints.customers,
      data: payload,
    }),

  getCustomerStatus: (customerId) =>
    request({
      method: "get",
      url: replacePathParams(integrationConfig.erp.endpoints.customerStatus, {
        customerId,
      }),
    }),

  updateCustomerStatus: (customerId, statusPayload) =>
    request({
      method: "put",
      url: replacePathParams(integrationConfig.erp.endpoints.customerStatus, {
        customerId,
      }),
      data: statusPayload,
    }),
};

module.exports = erpApiClient;
