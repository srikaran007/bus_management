const { Driver, Bus } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const serializeDriver = (driver) => {
  const data = driver.toJSON();
  if (data.assignedBusDetails) {
    data.assignedBus = data.assignedBusDetails;
    delete data.assignedBusDetails;
  }
  return data;
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
  const where = mergeFilters(searchFilter, statusFilter, busFilter);

  const { rows, count } = await Driver.findAndCountAll({
    where,
    include: [{ model: Bus, as: "assignedBusDetails" }],
    order,
    offset,
    limit
  });

  res.json({
    items: rows.map(serializeDriver),
    pagination: getPaginationMeta(count, page, limit)
  });
});

const getDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id, {
    include: [{ model: Bus, as: "assignedBusDetails" }]
  });
  if (!driver) throw new AppError("Driver not found", 404);
  res.json(serializeDriver(driver));
});

const createDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.create(req.body);
  res.status(201).json(driver);
});

const updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);
  if (!driver) throw new AppError("Driver not found", 404);
  await driver.update(req.body);
  res.json(driver);
});

const deleteDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);
  if (!driver) throw new AppError("Driver not found", 404);
  await driver.destroy();
  res.json({ message: "Driver deleted successfully" });
});

module.exports = { getDrivers, getDriverById, createDriver, updateDriver, deleteDriver };
