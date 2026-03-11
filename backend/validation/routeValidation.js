const Joi = require("joi");

const createRouteSchema = Joi.object({
  routeId: Joi.string().required(),
  routeName: Joi.string().required(),
  startingPoint: Joi.string().required(),
  endingPoint: Joi.string().required(),
  stops: Joi.array().items(Joi.string()).default([]),
  assignedBus: Joi.string().optional()
});

const updateRouteSchema = createRouteSchema.min(1);

module.exports = { createRouteSchema, updateRouteSchema };
