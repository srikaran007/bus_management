const { AuditLog, User } = require("../models");
const asyncHandler = require("../utils/asyncHandler");
const { institutionFilter } = require("../utils/institutionScope");
const {
  Op,
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const serializeAudit = (log) => {
  const data = log.toJSON();
  if (data.userDetails) {
    data.user = data.userDetails;
    delete data.userDetails;
  }
  return data;
};

const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt",
    maxLimit: 200
  });

  const roleFilter = req.query.role ? { role: req.query.role } : {};
  const methodFilter = req.query.method ? { method: req.query.method.toUpperCase() } : {};
  const userFilter = req.query.userId ? { user: Number(req.query.userId) || req.query.userId } : {};
  const statusFilter = req.query.statusCode ? { statusCode: Number(req.query.statusCode) } : {};
  const searchFilter = buildRegexSearchFilter(req.query.search, ["path", "ip", "userAgent"]);

  const dateFilter = {};
  if (req.query.from || req.query.to) {
    if (req.query.from && req.query.to) {
      dateFilter.createdAt = { [Op.between]: [new Date(req.query.from), new Date(req.query.to)] };
    } else if (req.query.from) {
      dateFilter.createdAt = { [Op.gte]: new Date(req.query.from) };
    } else if (req.query.to) {
      dateFilter.createdAt = { [Op.lte]: new Date(req.query.to) };
    }
  }

  const where = mergeFilters(
    roleFilter,
    methodFilter,
    userFilter,
    statusFilter,
    dateFilter,
    searchFilter,
    institutionFilter(req)
  );

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, as: "userDetails", attributes: ["id", "name", "email", "role"] }],
    order,
    offset,
    limit
  });

  res.json({
    items: rows.map(serializeAudit),
    pagination: getPaginationMeta(count, page, limit)
  });
});

module.exports = { getAuditLogs };
