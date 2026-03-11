const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toSortObject = (sort, defaultSort = "-createdAt") => {
  const sortValue = (sort || defaultSort).trim();
  const sortObject = {};

  sortValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      if (entry.startsWith("-")) {
        sortObject[entry.slice(1)] = -1;
      } else {
        sortObject[entry] = 1;
      }
    });

  if (!Object.keys(sortObject).length) {
    sortObject.createdAt = -1;
  }
  return sortObject;
};

const createPaginationOptions = (query = {}, options = {}) => {
  const page = toInt(query.page, DEFAULT_PAGE);
  const requestedLimit = toInt(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, options.maxLimit || MAX_LIMIT);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    sort: toSortObject(query.sort, options.defaultSort)
  };
};

const buildRegexSearchFilter = (search, fields = []) => {
  const searchValue = (search || "").trim();
  if (!searchValue || !fields.length) return {};

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: searchValue, $options: "i" }
    }))
  };
};

const mergeFilters = (...filters) => {
  const cleaned = filters.filter((filter) => Object.keys(filter || {}).length > 0);
  if (!cleaned.length) return {};
  if (cleaned.length === 1) return cleaned[0];
  return { $and: cleaned };
};

const getPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.max(1, Math.ceil(total / limit))
});

module.exports = {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
};
