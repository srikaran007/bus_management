const crypto = require("crypto");

const attachRequestId = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

module.exports = { attachRequestId };
