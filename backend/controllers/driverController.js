const { getRequestModels, getInstitutionModels } = require("../models");
const { Op } = require("sequelize");
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

const serializeDriver = (driver) => {
  const data = typeof driver.toJSON === "function" ? driver.toJSON() : { ...driver };
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

const summarizeDrivers = (rows = []) => {
  const total = rows.length;
  const active = rows.filter((row) => row.status === "Active").length;
  const assigned = rows.filter((row) => row.assignedBus).length;

  return {
    total,
    active,
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

const hasDriverAccess = (req, driver) => {
  if (isAdmin(req)) return true;
  return canAccessInstitutionRecord(req, driver);
};

const getDriversForAdmin = async (req, filters, order, offset, limit, page) => {
  const institution = resolveRequestedInstitution(req);
  const institutions = institution ? [institution] : INSTITUTIONS;

  const driverRowsByInstitution = await Promise.all(
    institutions.map(async (name) => {
      const { Driver, Bus } = getInstitutionModels(name);
      const rows = await Driver.findAll({
        where: filters,
        include: [{ model: Bus, as: "assignedBusDetails", required: false }]
      });

      return rows.map((row) => {
        const serialized = serializeDriver(row);
        return {
          ...serialized,
          institution: serialized.institution || name
        };
      });
    })
  );

  const combined = sortRows(driverRowsByInstitution.flat(), order);
  const paginatedItems = combined.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    pagination: getPaginationMeta(combined.length, page, limit),
    summary: summarizeDrivers(combined)
  };
};

const getDrivers = asyncHandler(async (req, res) => {
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const searchFilter = buildRegexSearchFilter(req.query.search, [
    "driverName",
    "driverId",
    "phone",
    "licenseNumber"
  ]);
  const statusFilter = req.query.status ? { status: req.query.status } : {};
  const busFilter = req.query.assignedBus ? { assignedBus: req.query.assignedBus } : {};

  if (isAdmin(req)) {
    const result = await getDriversForAdmin(
      req,
      mergeFilters(searchFilter, statusFilter, busFilter),
      order,
      offset,
      limit,
      page
    );
    return res.json(result);
  }

  const { Driver, Bus, Student, Route } = getRequestModels(req);
  const roleFilter = {};

  if ([ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER].includes(req.user?.role)) {
    const assigned = await getAssignedScope(req, { Bus, Driver, Student, Route });
    if (req.user?.role === ROLES.DRIVER && assigned.driverId) {
      roleFilter.id = assigned.driverId;
    } else if (assigned.busId) {
      roleFilter.assignedBus = assigned.busId;
    } else {
      return res.json({
        items: [],
        pagination: getPaginationMeta(0, page, limit),
        summary: summarizeDrivers([])
      });
    }
  }

  const where = mergeFilters(searchFilter, statusFilter, busFilter, roleFilter, institutionFilter(req));
  const busWhere = institutionFilter(req);

  const [{ rows, count }, active, assigned] = await Promise.all([
    Driver.findAndCountAll({
      where,
      include: [{ model: Bus, as: "assignedBusDetails", where: busWhere, required: false }],
      order,
      offset,
      limit
    }),
    Driver.count({ where: mergeFilters(where, { status: "Active" }) }),
    Driver.count({ where: mergeFilters(where, { assignedBus: { [Op.ne]: null } }) })
  ]);

  return res.json({
    items: rows.map(serializeDriver),
    pagination: getPaginationMeta(count, page, limit),
    summary: {
      total: count,
      active,
      assigned,
      unassigned: count - assigned
    }
  });
});

const getDriverById = asyncHandler(async (req, res) => {
  const { Driver, Bus, Student, Route } = getScopedModels(req);
  const busWhere = isAdmin(req) ? {} : institutionFilter(req);
  const driver = await Driver.findByPk(req.params.id, {
    include: [{ model: Bus, as: "assignedBusDetails", where: busWhere, required: false }]
  });
  if (!driver || !hasDriverAccess(req, driver)) throw new AppError("Driver not found", 404);

  if ([ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER].includes(req.user?.role)) {
    const assigned = await getAssignedScope(req, { Bus, Driver, Student, Route });
    const isAllowed =
      (req.user?.role === ROLES.DRIVER && assigned.driverId && String(assigned.driverId) === String(driver.id)) ||
      (assigned.busId && String(assigned.busId) === String(driver.assignedBus));
    if (!isAllowed) throw new AppError("Forbidden for this role", 403);
  }

  res.json(serializeDriver(driver));
});

const createDriver = asyncHandler(async (req, res) => {
  if (isAdmin(req)) {
    const institution = resolveRequestedInstitution(req) || req.user?.institution;
    if (!institution) {
      throw new AppError("Institution is required for admin driver creation", 400);
    }

    const { Driver } = getInstitutionModels(institution);
    const payload = { ...req.body, institution };
    const driver = await Driver.create(payload);
    return res.status(201).json(driver);
  }

  const { Driver } = getRequestModels(req);
  const driver = await Driver.create(withInstitution(req, req.body));
  return res.status(201).json(driver);
});

const updateDriver = asyncHandler(async (req, res) => {
  const { Driver } = getScopedModels(req);
  const driver = await Driver.findByPk(req.params.id);
  if (!driver || !hasDriverAccess(req, driver)) throw new AppError("Driver not found", 404);

  const updates = { ...req.body };
  delete updates.institution;
  await driver.update(updates);
  res.json(driver);
});

const deleteDriver = asyncHandler(async (req, res) => {
  const { Driver } = getScopedModels(req);
  const driver = await Driver.findByPk(req.params.id);
  if (!driver || !hasDriverAccess(req, driver)) throw new AppError("Driver not found", 404);
  await driver.destroy();
  res.json({ message: "Driver deleted successfully" });
});

module.exports = { getDrivers, getDriverById, createDriver, updateDriver, deleteDriver };
