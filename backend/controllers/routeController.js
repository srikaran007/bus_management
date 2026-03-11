const { Route, Bus } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  createPaginationOptions,
  buildRegexSearchFilter,
  mergeFilters,
  getPaginationMeta
} = require("../utils/queryFeatures");

const serializeRoute = (route) => {
  const data = route.toJSON();
  if (data.assignedBusDetails) {
    data.assignedBus = data.assignedBusDetails;
    delete data.assignedBusDetails;
  }
  return data;
};

const getRoutes = asyncHandler(async (req, res) => {
  const { page, limit, offset, order } = createPaginationOptions(req.query, {
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
  const where = mergeFilters(searchFilter, busFilter);

  const { rows, count } = await Route.findAndCountAll({
    where,
    include: [{ model: Bus, as: "assignedBusDetails" }],
    order,
    offset,
    limit
  });

  res.json({
    items: rows.map(serializeRoute),
    pagination: getPaginationMeta(count, page, limit)
  });
});

const getRouteById = asyncHandler(async (req, res) => {
  const route = await Route.findByPk(req.params.id, {
    include: [{ model: Bus, as: "assignedBusDetails" }]
  });
  if (!route) throw new AppError("Route not found", 404);
  res.json(serializeRoute(route));
});

const createRoute = asyncHandler(async (req, res) => {
  const route = await Route.create(req.body);
  res.status(201).json(route);
});

const updateRoute = asyncHandler(async (req, res) => {
  const route = await Route.findByPk(req.params.id);
  if (!route) throw new AppError("Route not found", 404);
  await route.update(req.body);
  res.json(route);
});

const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findByPk(req.params.id);
  if (!route) throw new AppError("Route not found", 404);
  await route.destroy();
  res.json({ message: "Route deleted successfully" });
});

module.exports = { getRoutes, getRouteById, createRoute, updateRoute, deleteRoute };
