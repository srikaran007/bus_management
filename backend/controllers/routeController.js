const { Op } = require("sequelize");
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

const serializeRoute = (route) => {
  const data = typeof route.toJSON === "function" ? route.toJSON() : { ...route };
  if (data.assignedBusDetails) {
    data.assignedBus = data.assignedBusDetails;
    delete data.assignedBusDetails;
  }
  return data;
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

const summarizeRoutes = (rows = []) => {
  const total = rows.length;
  const assigned = rows.filter((row) => row.assignedBus).length;

  return {
    total,
    assigned,
    unassigned: total - assigned
  };
};

const getScopedModels = (req) => {
  if (!isAdmin(req)) return getRequestModels(req);

  const institution = resolveRequestedInstitution(req) || req.user?.institution;
  if (!institution) {
    throw new AppError("Institution is required for this action", 400);
  }

  return getInstitutionModels(institution);
};

const hasRouteAccess = (req, route) => {
  if (isAdmin(req)) return true;
  return canAccessInstitutionRecord(req, route);
};

const getRoutesForAdmin = async (req, filters, order, offset, limit, page) => {
  const institution = resolveRequestedInstitution(req);
  const institutions = institution ? [institution] : INSTITUTIONS;

  const routeRowsByInstitution = await Promise.all(
    institutions.map(async (name) => {
      const { Route, Bus } = getInstitutionModels(name);
      const rows = await Route.findAll({
        where: filters,
        include: [{ model: Bus, as: "assignedBusDetails", required: false }]
      });

      return rows.map((row) => {
        const serialized = serializeRoute(row);
        return {
          ...serialized,
          institution: serialized.institution || name
        };
      });
    })
  );

  const combined = sortRows(routeRowsByInstitution.flat(), order);
  const paginatedItems = combined.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    pagination: getPaginationMeta(combined.length, page, limit),
    summary: summarizeRoutes(combined)
  };
};

const getRoutes = asyncHandler(async (req, res) => {
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const searchFilter = buildRegexSearchFilter(req.query.search, [
    "routeId",
    "routeName",
    "startingPoint",
    "endingPoint"
  ]);

  const busFilter = req.query.assignedBus ? { assignedBus: req.query.assignedBus } : {};
  const assignmentFilter =
    req.query.assignment === "unassigned"
      ? { assignedBus: null }
      : req.query.assignment === "assigned"
        ? { assignedBus: { [Op.ne]: null } }
        : {};

  if (isAdmin(req)) {
    const result = await getRoutesForAdmin(
      req,
      mergeFilters(searchFilter, busFilter, assignmentFilter),
      order,
      offset,
      limit,
      page
    );
    return res.json(result);
  }

  const { Route, Bus, Driver, Student } = getRequestModels(req);
  const roleFilter = {};

  if ([ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER].includes(req.user?.role)) {
    const assigned = await getAssignedScope(req, { Bus, Driver, Student, Route });
    if (assigned.routeName) roleFilter.routeName = assigned.routeName;
    else if (assigned.busId) roleFilter.assignedBus = assigned.busId;
    else {
      return res.json({
        items: [],
        pagination: getPaginationMeta(0, page, limit),
        summary: summarizeRoutes([])
      });
    }
  }

  const where = mergeFilters(searchFilter, busFilter, assignmentFilter, roleFilter, institutionFilter(req));
  const busWhere = institutionFilter(req);

  const [{ rows, count }, assigned] = await Promise.all([
    Route.findAndCountAll({
      where,
      include: [{ model: Bus, as: "assignedBusDetails", where: busWhere, required: false }],
      order,
      offset,
      limit
    }),
    Route.count({ where: mergeFilters(where, { assignedBus: { [Op.ne]: null } }) })
  ]);

  return res.json({
    items: rows.map(serializeRoute),
    pagination: getPaginationMeta(count, page, limit),
    summary: {
      total: count,
      assigned,
      unassigned: count - assigned
    }
  });
});

const getRouteById = asyncHandler(async (req, res) => {
  const { Route, Bus, Driver, Student } = getScopedModels(req);
  const busWhere = isAdmin(req) ? {} : institutionFilter(req);
  const route = await Route.findByPk(req.params.id, {
    include: [{ model: Bus, as: "assignedBusDetails", where: busWhere, required: false }]
  });
  if (!route || !hasRouteAccess(req, route)) throw new AppError("Route not found", 404);

  if ([ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER].includes(req.user?.role)) {
    const assigned = await getAssignedScope(req, { Bus, Driver, Student, Route });
    const isAllowed =
      (assigned.routeName && String(assigned.routeName) === String(route.routeName)) ||
      (assigned.busId && String(assigned.busId) === String(route.assignedBus));
    if (!isAllowed) throw new AppError("Forbidden for this role", 403);
  }

  res.json(serializeRoute(route));
});

const createRoute = asyncHandler(async (req, res) => {
  if (isAdmin(req)) {
    const institution = resolveRequestedInstitution(req) || req.user?.institution;
    if (!institution) {
      throw new AppError("Institution is required for admin route creation", 400);
    }

    const { Route } = getInstitutionModels(institution);
    const payload = { ...req.body, institution };
    const route = await Route.create(payload);
    return res.status(201).json(route);
  }

  const { Route } = getRequestModels(req);
  const route = await Route.create(withInstitution(req, req.body));
  return res.status(201).json(route);
});

const updateRoute = asyncHandler(async (req, res) => {
  const { Route } = getScopedModels(req);
  const route = await Route.findByPk(req.params.id);
  if (!route || !hasRouteAccess(req, route)) throw new AppError("Route not found", 404);

  const updates = { ...req.body };
  delete updates.institution;
  await route.update(updates);
  res.json(route);
});

const deleteRoute = asyncHandler(async (req, res) => {
  const { Route } = getScopedModels(req);
  const route = await Route.findByPk(req.params.id);
  if (!route || !hasRouteAccess(req, route)) throw new AppError("Route not found", 404);
  await route.destroy();
  res.json({ message: "Route deleted successfully" });
});

module.exports = { getRoutes, getRouteById, createRoute, updateRoute, deleteRoute };
