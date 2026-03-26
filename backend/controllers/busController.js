const { getRequestModels, getInstitutionModels } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { institutionFilter, withInstitution, canAccessInstitutionRecord } = require("../utils/institutionScope");
const { ROLES, INSTITUTIONS } = require("../utils/constants");
const { getAssignedScope } = require("../utils/assignmentScope");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const isAdmin = (req) => req.user?.role === ROLES.ADMIN;

const normalizeInstitution = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const resolveRequestedInstitution = (req) => {
  const requested = req.query?.institution || req.body?.institution;
  if (!requested) return null;

  const match = INSTITUTIONS.find(
    (institution) => normalizeInstitution(institution) === normalizeInstitution(requested)
  );
  if (!match) {
    throw new AppError("Invalid institution", 400);
  }

  return match;
};

const compareValues = (leftValue, rightValue, direction) => {
  const left = leftValue instanceof Date ? leftValue.getTime() : leftValue;
  const right = rightValue instanceof Date ? rightValue.getTime() : rightValue;

  if (left == null && right == null) return 0;
  if (left == null) return direction === "DESC" ? 1 : -1;
  if (right == null) return direction === "DESC" ? -1 : 1;

  const leftComparable = typeof left === "string" ? left.toLowerCase() : left;
  const rightComparable = typeof right === "string" ? right.toLowerCase() : right;

  if (leftComparable < rightComparable) return direction === "DESC" ? 1 : -1;
  if (leftComparable > rightComparable) return direction === "DESC" ? -1 : 1;
  return 0;
};

const sortRows = (rows, order = []) => {
  if (!order.length) return rows;

  return rows.sort((left, right) => {
    for (const [field, direction = "ASC"] of order) {
      const result = compareValues(left[field], right[field], direction);
      if (result !== 0) return result;
    }
    return 0;
  });
};

const summarizeRows = (rows = []) => {
  const total = rows.length;
  const active = rows.filter((row) => row.status === "Active").length;
  const maintenance = rows.filter((row) => row.status === "Maintenance").length;
  const capacityTotal = rows.reduce((sum, row) => sum + Number(row.capacity || 0), 0);

  return {
    total,
    active,
    maintenance,
    capacityTotal
  };
};

const getScopedBusModel = (req) => {
  if (!isAdmin(req)) {
    return getRequestModels(req).Bus;
  }

  const institution = resolveRequestedInstitution(req) || req.user?.institution;
  if (!institution) {
    throw new AppError("Institution is required for this action", 400);
  }

  return getInstitutionModels(institution).Bus;
};

const hasBusAccess = (req, bus) => {
  if (isAdmin(req)) return true;
  return canAccessInstitutionRecord(req, bus);
};

const getBusesForAdmin = async (req, filters, order, offset, limit, page) => {
  const institution = resolveRequestedInstitution(req);
  const institutions = institution ? [institution] : INSTITUTIONS;

  const itemsByInstitution = await Promise.all(
    institutions.map(async (name) => {
      const { Bus } = getInstitutionModels(name);
      const rows = await Bus.findAll({
        where: filters,
        raw: true
      });

      return rows.map((row) => ({
        ...row,
        institution: row.institution || name
      }));
    })
  );

  const combined = sortRows(itemsByInstitution.flat(), order);
  const paginatedItems = combined.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    pagination: getPaginationMeta(combined.length, page, limit),
    summary: summarizeRows(combined)
  };
};

const getBuses = asyncHandler(async (req, res) => {
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const searchFilter = buildRegexSearchFilter(req.query.search, ["busNumber", "busName", "status"]);
  const statusFilter = req.query.status ? { status: req.query.status } : {};

  if (isAdmin(req)) {
    const adminResult = await getBusesForAdmin(
      req,
      mergeFilters(searchFilter, statusFilter),
      order,
      offset,
      limit,
      page
    );
    return res.json(adminResult);
  }

  const { Bus, Driver, Student, Route } = getRequestModels(req);
  const roleFilter = {};

  if ([ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER].includes(req.user?.role)) {
    const assigned = await getAssignedScope(req, { Bus, Driver, Student, Route });
    if (assigned.busId) roleFilter.id = assigned.busId;
    else if (assigned.busNumber) roleFilter.busNumber = assigned.busNumber;
    else {
      return res.json({
        items: [],
        pagination: getPaginationMeta(0, page, limit),
        summary: summarizeRows([])
      });
    }
  }

  const where = mergeFilters(searchFilter, statusFilter, roleFilter, institutionFilter(req));

  const [{ rows, count }, active, maintenance, capacityTotalRaw] = await Promise.all([
    Bus.findAndCountAll({
      where,
      order,
      offset,
      limit
    }),
    Bus.count({ where: mergeFilters(where, { status: "Active" }) }),
    Bus.count({ where: mergeFilters(where, { status: "Maintenance" }) }),
    Bus.sum("capacity", { where })
  ]);

  return res.json({
    items: rows,
    pagination: getPaginationMeta(count, page, limit),
    summary: {
      total: count,
      active,
      maintenance,
      capacityTotal: Number(capacityTotalRaw || 0)
    }
  });
});

const getBusById = asyncHandler(async (req, res) => {
  const Bus = getScopedBusModel(req);
  const bus = await Bus.findByPk(req.params.id);
  if (!bus || !hasBusAccess(req, bus)) throw new AppError("Bus not found", 404);

  if ([ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER].includes(req.user?.role)) {
    const { Driver, Student, Route } = getRequestModels(req);
    const assigned = await getAssignedScope(req, { Bus, Driver, Student, Route });
    const isAllowed =
      (assigned.busId && String(assigned.busId) === String(bus.id)) ||
      (assigned.busNumber && String(assigned.busNumber) === String(bus.busNumber));
    if (!isAllowed) throw new AppError("Forbidden for this role", 403);
  }

  res.json(bus);
});

const createBus = asyncHandler(async (req, res) => {
  let payload = { ...req.body };

  if (isAdmin(req)) {
    const institution = resolveRequestedInstitution(req) || req.user?.institution;
    if (!institution) {
      throw new AppError("Institution is required for admin bus creation", 400);
    }

    const { Bus } = getInstitutionModels(institution);
    payload = { ...payload, institution };
    const bus = await Bus.create(payload);
    return res.status(201).json(bus);
  }

  const { Bus } = getRequestModels(req);
  const bus = await Bus.create(withInstitution(req, payload));
  return res.status(201).json(bus);
});

const updateBus = asyncHandler(async (req, res) => {
  const Bus = getScopedBusModel(req);
  const bus = await Bus.findByPk(req.params.id);
  if (!bus || !hasBusAccess(req, bus)) throw new AppError("Bus not found", 404);

  const updates = { ...req.body };
  delete updates.institution;
  await bus.update(updates);
  res.json(bus);
});

const deleteBus = asyncHandler(async (req, res) => {
  const Bus = getScopedBusModel(req);
  const bus = await Bus.findByPk(req.params.id);
  if (!bus || !hasBusAccess(req, bus)) throw new AppError("Bus not found", 404);
  await bus.destroy();
  res.json({ message: "Bus deleted successfully" });
});

module.exports = { getBuses, getBusById, createBus, updateBus, deleteBus };
