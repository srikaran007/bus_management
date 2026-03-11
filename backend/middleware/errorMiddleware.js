const AppError = require("../utils/AppError");

const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    requestId: req.requestId,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
};

module.exports = { notFound, errorHandler };
