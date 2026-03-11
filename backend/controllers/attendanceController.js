const { Attendance, EntryExitLog, User } = require("../models");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { ROLES } = require("../utils/constants");
const {
  Op,
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const serializeAttendance = (entry) => {
  const data = entry.toJSON();
  if (data.markedByUser) {
    data.markedBy = data.markedByUser;
    delete data.markedByUser;
  }
  return data;
};

const getAttendance = asyncHandler(async (req, res) => {
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const dateFilter = {};
  if (req.query.from || req.query.to) {
    if (req.query.from && req.query.to) {
      dateFilter.date = { [Op.between]: [new Date(req.query.from), new Date(req.query.to)] };
    } else if (req.query.from) {
      dateFilter.date = { [Op.gte]: new Date(req.query.from) };
    } else if (req.query.to) {
      dateFilter.date = { [Op.lte]: new Date(req.query.to) };
    }
  } else if (req.query.date) {
    dateFilter.date = new Date(req.query.date);
  }

  const subjectTypeFilter = req.query.subjectType ? { subjectType: req.query.subjectType } : {};
  const subjectIdFilter = req.query.subjectId ? { subjectId: req.query.subjectId } : {};
  const statusFilter = req.query.status ? { status: req.query.status } : {};
  const searchFilter = buildRegexSearchFilter(req.query.search, ["subjectId", "status"]);
  const where = mergeFilters(dateFilter, subjectTypeFilter, subjectIdFilter, statusFilter, searchFilter);

  const { rows, count } = await Attendance.findAndCountAll({
    where,
    include: [{ model: User, as: "markedByUser", attributes: ["id", "name", "role"] }],
    order,
    offset,
    limit
  });

  res.json({
    items: rows.map(serializeAttendance),
    pagination: getPaginationMeta(count, page, limit)
  });
});

const markAttendance = asyncHandler(async (req, res) => {
  if (req.user.role === ROLES.DRIVER && req.body.subjectType !== "Driver") {
    throw new AppError("Drivers can only submit driver attendance", 403);
  }

  if (req.user.role === ROLES.STAFF && req.body.subjectType !== "Student") {
    throw new AppError("Staff can only submit student attendance", 403);
  }

  const payload = { ...req.body };
  if (req.user) payload.markedBy = req.user.id;

  const record = await Attendance.create(payload);
  res.status(201).json(record);
});

const getEntryExitLogs = asyncHandler(async (req, res) => {
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const busFilter = req.query.busNumber ? { busNumber: req.query.busNumber } : {};
  const routeFilter = req.query.route ? { route: req.query.route } : {};
  const statusFilter = req.query.status ? { status: req.query.status } : {};
  const searchFilter = buildRegexSearchFilter(req.query.search, ["busNumber", "driverName", "route", "status"]);

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

  const where = mergeFilters(busFilter, routeFilter, statusFilter, searchFilter, dateFilter);
  const { rows, count } = await EntryExitLog.findAndCountAll({
    where,
    order,
    offset,
    limit
  });

  res.json({
    items: rows,
    pagination: getPaginationMeta(count, page, limit)
  });
});

const createEntryExitLog = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.user) payload.submittedBy = req.user.id;
  payload.status = payload.exitTime ? "Completed" : "Running";

  const log = await EntryExitLog.create(payload);
  res.status(201).json(log);
});

module.exports = { getAttendance, markAttendance, getEntryExitLogs, createEntryExitLog };
