const { Op } = require("sequelize");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toOrderArray = (sort, defaultSort = "-createdAt") => {
  const sortValue = (sort || defaultSort).trim();
  const order = sortValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      if (entry.startsWith("-")) return [entry.slice(1), "DESC"];
      return [entry, "ASC"];
    });

  return order.length ? order : [["createdAt", "DESC"]];
};

const createPaginationOptions = (query = {}, options = {}) => {
  const page = toInt(query.page, DEFAULT_PAGE);
  const requestedLimit = toInt(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, options.maxLimit || MAX_LIMIT);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    skip: offset,
    offset,
    sort: toOrderArray(query.sort, options.defaultSort),
    order: toOrderArray(query.sort, options.defaultSort)
  };
};

const buildRegexSearchFilter = (search, fields = []) => {
  const searchValue = String(search || "").trim();
  if (!searchValue || !fields.length) return {};

  return {
    [Op.or]: fields.map((field) => ({
      [field]: { [Op.like]: `%${searchValue}%` }
    }))
  };
};

const mergeFilters = (...filters) => {
  const cleaned = filters.filter((filter) => Object.keys(filter || {}).length > 0);
  if (!cleaned.length) return {};
  if (cleaned.length === 1) return cleaned[0];
  return { [Op.and]: cleaned };
};

const getPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.max(1, Math.ceil(total / limit))
});

module.exports = {
  Op,
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
};
