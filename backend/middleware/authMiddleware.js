const jwt = require("jsonwebtoken");
const { User } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Not authorized, token missing", 401);
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
  } catch (_error) {
    throw new AppError("Not authorized, token invalid", 401);
  }

  req.user = await User.findByPk(decoded.id, {
    attributes: { exclude: ["password"] }
  });

  if (!req.user) {
    throw new AppError("User no longer exists", 401);
  }

  return next();
});

module.exports = { protect };
