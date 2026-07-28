export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://vconstech-crm-new.onrender.com"
)
  .trim()
  .replace(/\/$/, "");
