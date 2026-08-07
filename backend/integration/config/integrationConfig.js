const requiredEnv = (name) => process.env[name] || "";

const normalizeBaseUrl = (url) => {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const integrationConfig = {
  erp: {
    baseUrl: normalizeBaseUrl(requiredEnv("ERP_BASE_URL")),
    apiKey: requiredEnv("ERP_API_KEY"),
    webhookSecret: requiredEnv("ERP_WEBHOOK_SECRET"),
    timeoutMs: Number(process.env.ERP_API_TIMEOUT_MS || 10000),
    retryAttempts: Number(process.env.ERP_API_RETRY_ATTEMPTS || 3),
    retryDelayMs: Number(process.env.ERP_API_RETRY_DELAY_MS || 500),
    endpoints: {
      invitations: process.env.ERP_INVITATION_PATH || "/api/invitations",
      customers: process.env.ERP_CUSTOMER_PATH || "/api/customers",
      superadminUsers: process.env.ERP_SUPERADMIN_USERS_PATH || "/api/superadmin/users",
      superadminUpdateUser:
        process.env.ERP_SUPERADMIN_UPDATE_USER_PATH || "/api/superadmin/update-user/:userId",
      superadminToggleActive:
        process.env.ERP_SUPERADMIN_TOGGLE_ACTIVE_PATH || "/api/superadmin/toggle-active/:userId",
      customerStatus:
        process.env.ERP_CUSTOMER_STATUS_PATH ||
        "/api/subscription-sync/customers/:customerId/status",
    },
  },
};

module.exports = integrationConfig;
