const Bus = require("../models/Bus");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const getBuses = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = createPaginationOptions(req.query, {
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
  const filter = mergeFilters(searchFilter, statusFilter, routeFilter);

  const [items, total] = await Promise.all([
    Bus.find(filter).populate("driver").sort(sort).skip(skip).limit(limit),
    Bus.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: getPaginationMeta(total, page, limit)
  });
});

const getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id).populate("driver");
  if (!bus) throw new AppError("Bus not found", 404);
  res.json(bus);
});

const createBus = asyncHandler(async (req, res) => {
  const bus = await Bus.create(req.body);
  res.status(201).json(bus);
});

const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!bus) throw new AppError("Bus not found", 404);
  res.json(bus);
});

const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndDelete(req.params.id);
  if (!bus) throw new AppError("Bus not found", 404);
  res.json({ message: "Bus deleted successfully" });
});

module.exports = { getBuses, getBusById, createBus, updateBus, deleteBus };
