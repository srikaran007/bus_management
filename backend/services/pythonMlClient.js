const AppError = require("../utils/AppError");

const DEFAULT_ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";
const REQUEST_TIMEOUT_MS = Number(process.env.ML_SERVICE_TIMEOUT_MS || 12000);

const postToMlService = async (path, payload) => {
  if (typeof fetch !== "function") {
    throw new AppError("Fetch API is unavailable in this Node runtime", 500);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${DEFAULT_ML_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new AppError(data.message || "Python ML service returned an error", 502);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError("Python ML service timeout", 504);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Unable to reach Python ML service", 503);
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { postToMlService };
