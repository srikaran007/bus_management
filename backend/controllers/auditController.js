const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt",
    maxLimit: 200
  });

  const roleFilter = req.query.role ? { role: req.query.role } : {};
  const methodFilter = req.query.method ? { method: req.query.method.toUpperCase() } : {};
  const userFilter = req.query.userId ? { user: req.query.userId } : {};
  const statusFilter = req.query.statusCode ? { statusCode: Number(req.query.statusCode) } : {};
  const searchFilter = buildRegexSearchFilter(req.query.search, ["path", "ip", "userAgent"]);

  const dateFilter = {};
  if (req.query.from || req.query.to) {
    dateFilter.createdAt = {};
    if (req.query.from) dateFilter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) dateFilter.createdAt.$lte = new Date(req.query.to);
  }

  const filter = mergeFilters(roleFilter, methodFilter, userFilter, statusFilter, dateFilter, searchFilter);

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("user", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: getPaginationMeta(total, page, limit)
  });
});

module.exports = { getAuditLogs };
