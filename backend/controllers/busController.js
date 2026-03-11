const { Bus, Driver } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const serializeBus = (bus) => {
  const data = bus.toJSON();
  if (data.driverDetails) {
    data.driver = data.driverDetails;
    delete data.driverDetails;
  }
  return data;
};

const getBuses = asyncHandler(async (req, res) => {
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const searchFilter = buildRegexSearchFilter(req.query.search, [
    "busNumber",
    "busName",
    "routeName",
    "status"
  ]);
  const statusFilter = req.query.status ? { status: req.query.status } : {};
  const routeFilter = req.query.routeName ? { routeName: req.query.routeName } : {};
  const where = mergeFilters(searchFilter, statusFilter, routeFilter);

  const { rows, count } = await Bus.findAndCountAll({
    where,
    include: [{ model: Driver, as: "driverDetails" }],
    order,
    offset,
    limit
  });

  res.json({
    items: rows.map(serializeBus),
    pagination: getPaginationMeta(count, page, limit)
  });
});

const getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findByPk(req.params.id, {
    include: [{ model: Driver, as: "driverDetails" }]
  });
  if (!bus) throw new AppError("Bus not found", 404);
  res.json(serializeBus(bus));
});

const createBus = asyncHandler(async (req, res) => {
  const bus = await Bus.create(req.body);
  res.status(201).json(bus);
});

const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByPk(req.params.id);
  if (!bus) throw new AppError("Bus not found", 404);
  await bus.update(req.body);
  res.json(bus);
});

const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByPk(req.params.id);
  if (!bus) throw new AppError("Bus not found", 404);
  await bus.destroy();
  res.json({ message: "Bus deleted successfully" });
});

module.exports = { getBuses, getBusById, createBus, updateBus, deleteBus };
