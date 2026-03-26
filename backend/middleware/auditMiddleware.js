const AuditLog = require("../models/AuditLog");

const SENSITIVE_KEYS = new Set([
  "password",
  "refreshToken",
  "token",
  "accessToken",
  "resetToken",
  "resetPasswordToken"
]);

const maskSensitive = (value) => {
  if (Array.isArray(value)) {
    return value.map(maskSensitive);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const masked = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (SENSITIVE_KEYS.has(key)) {
      masked[key] = "[redacted]";
    } else {
      masked[key] = maskSensitive(entry);
    }
  });
  return masked;
};

const shouldAudit = (req) => req.originalUrl.startsWith("/api/") && !req.originalUrl.startsWith("/api/docs");

const auditLogger = (req, res, next) => {
  if (!shouldAudit(req)) {
    return next();
  }

  const start = Date.now();

  res.on("finish", async () => {
    try {
      await AuditLog.create({
        requestId: req.requestId,
        user: req.user?.id || req.user?._id,
        role: req.user?.role,
        institution: req.user?.institution || null,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        requestBody: req.method === "GET" ? undefined : maskSensitive(req.body),
        query: maskSensitive(req.query)
      });
    } catch (_error) {
      // Avoid breaking API response flow if audit write fails.
    }
  });

  return next();
};

module.exports = { auditLogger };
