const Route = require("../models/Route");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const getRoutes = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = createPaginationOptions(req.query, {
    defaultSort: "-createdAt"
  });

  const searchFilter = buildRegexSearchFilter(req.query.search, [
    "routeId",
    "routeName",
    "startingPoint",
    "endingPoint",
    "stops"
  ]);
  const busFilter = req.query.assignedBus ? { assignedBus: req.query.assignedBus } : {};
  const filter = mergeFilters(searchFilter, busFilter);

  const [items, total] = await Promise.all([
    Route.find(filter).populate("assignedBus").sort(sort).skip(skip).limit(limit),
    Route.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: getPaginationMeta(total, page, limit)
  });
});

const getRouteById = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id).populate("assignedBus");
  if (!route) throw new AppError("Route not found", 404);
  res.json(route);
});

const createRoute = asyncHandler(async (req, res) => {
  const route = await Route.create(req.body);
  res.status(201).json(route);
});

const updateRoute = asyncHandler(async (req, res) => {
  const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!route) throw new AppError("Route not found", 404);
  res.json(route);
});

const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findByIdAndDelete(req.params.id);
  if (!route) throw new AppError("Route not found", 404);
  res.json({ message: "Route deleted successfully" });
});

module.exports = { getRoutes, getRouteById, createRoute, updateRoute, deleteRoute };
