const configuredApiUrl = import.meta.env.VITE_API_URL || "";

export const API_BASE_URL = (
  configuredApiUrl || "https://vconstech-crm-new.onrender.com"
)
  .trim()
  .replace(/\/$/, "");

export const ERP_API_BASE_URL = (
  import.meta.env.VITE_ERP_API_URL || "https://vconstech-test.onrender.com/api"
)
  .trim()
  .replace(/\/$/, "");

export const unwrapCustomerList = (payload) =>
  payload?.customers ||
  payload?.data?.customers ||
  payload?.users ||
  payload?.data?.users ||
  (Array.isArray(payload) ? payload : []);

export const unwrapCustomer = (payload) =>
  payload?.customer || payload?.data?.customer || payload;
