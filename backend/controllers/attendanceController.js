const Attendance = require("../models/Attendance");
const EntryExitLog = require("../models/EntryExitLog");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { ROLES } = require("../utils/constants");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const getAttendance = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const dateFilter = {};
  if (req.query.from || req.query.to) {
    dateFilter.date = {};
    if (req.query.from) dateFilter.date.$gte = new Date(req.query.from);
    if (req.query.to) dateFilter.date.$lte = new Date(req.query.to);
  } else if (req.query.date) {
    dateFilter.date = new Date(req.query.date);
  }

  const subjectTypeFilter = req.query.subjectType ? { subjectType: req.query.subjectType } : {};
  const subjectIdFilter = req.query.subjectId ? { subjectId: req.query.subjectId } : {};
  const statusFilter = req.query.status ? { status: req.query.status } : {};
  const searchFilter = buildRegexSearchFilter(req.query.search, ["subjectId", "status"]);
  const query = mergeFilters(dateFilter, subjectTypeFilter, subjectIdFilter, statusFilter, searchFilter);

  const [items, total] = await Promise.all([
    Attendance.find(query).populate("markedBy", "name role").sort(sort).skip(skip).limit(limit),
    Attendance.countDocuments(query)
  ]);

  res.json({
    items,
    pagination: getPaginationMeta(total, page, limit)
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
  if (req.user) payload.markedBy = req.user._id;

  const record = await Attendance.create(payload);
  res.status(201).json(record);
});

const getEntryExitLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const busFilter = req.query.busNumber ? { busNumber: req.query.busNumber } : {};
  const routeFilter = req.query.route ? { route: req.query.route } : {};
  const statusFilter = req.query.status ? { status: req.query.status } : {};
  const searchFilter = buildRegexSearchFilter(req.query.search, ["busNumber", "driverName", "route", "status"]);

  const dateFilter = {};
  if (req.query.from || req.query.to) {
    dateFilter.createdAt = {};
    if (req.query.from) dateFilter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) dateFilter.createdAt.$lte = new Date(req.query.to);
  }

  const query = mergeFilters(busFilter, routeFilter, statusFilter, searchFilter, dateFilter);
  const [items, total] = await Promise.all([
    EntryExitLog.find(query).sort(sort).skip(skip).limit(limit),
    EntryExitLog.countDocuments(query)
  ]);

  res.json({
    items,
    pagination: getPaginationMeta(total, page, limit)
  });
});

const createEntryExitLog = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.user) payload.submittedBy = req.user._id;
  payload.status = payload.exitTime ? "Completed" : "Running";

  const log = await EntryExitLog.create(payload);
  res.status(201).json(log);
});

module.exports = { getAttendance, markAttendance, getEntryExitLogs, createEntryExitLog };
