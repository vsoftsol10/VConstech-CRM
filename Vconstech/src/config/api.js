export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://vconstech-crm-new.onrender.com"
)
  .trim()
  .replace(/\/$/, "");

export const ERP_API_BASE_URL = (
  import.meta.env.VITE_ERP_API_URL || "https://vconstech-test.onrender.com/api"
)
  .trim()
  .replace(/\/$/, "");
