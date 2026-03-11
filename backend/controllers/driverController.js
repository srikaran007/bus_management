const Driver = require("../models/Driver");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const getDrivers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = createPaginationOptions(req.query, {
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
  const filter = mergeFilters(searchFilter, statusFilter, busFilter);

  const [items, total] = await Promise.all([
    Driver.find(filter).populate("assignedBus").sort(sort).skip(skip).limit(limit),
    Driver.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: getPaginationMeta(total, page, limit)
  });
});

const getDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id).populate("assignedBus");
  if (!driver) throw new AppError("Driver not found", 404);
  res.json(driver);
});

const createDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.create(req.body);
  res.status(201).json(driver);
});

const updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!driver) throw new AppError("Driver not found", 404);
  res.json(driver);
});

const deleteDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndDelete(req.params.id);
  if (!driver) throw new AppError("Driver not found", 404);
  res.json({ message: "Driver deleted successfully" });
});

module.exports = { getDrivers, getDriverById, createDriver, updateDriver, deleteDriver };
