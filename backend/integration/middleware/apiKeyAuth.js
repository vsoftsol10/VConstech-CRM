const crypto = require("crypto");
const integrationConfig = require("../config/integrationConfig");

const safeCompare = (left, right) => {
  if (!left || !right) return false;

  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const getProvidedApiKey = (req) => {
  const apiKey = req.get("x-api-key");
  const authHeader = req.get("authorization");

  if (apiKey) return apiKey;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return "";
};

const apiKeyAuth = (req, res, next) => {
  const expectedApiKey = integrationConfig.erp.apiKey;

  if (!expectedApiKey) {
    return res.status(500).json({
      success: false,
      error: "Integration API key is not configured",
    });
  }

  if (!safeCompare(getProvidedApiKey(req), expectedApiKey)) {
    return res.status(401).json({
      success: false,
      error: "Invalid integration credentials",
    });
  }

  next();
};

module.exports = apiKeyAuth;
