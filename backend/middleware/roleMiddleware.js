const AppError = require("../utils/AppError");

const allowRoles =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden for this role", 403));
    }

    return next();
  };

module.exports = { allowRoles };
