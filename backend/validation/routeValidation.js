const Joi = require("joi");
const { INSTITUTIONS } = require("../utils/constants");

const createRouteSchema = Joi.object({
  routeId: Joi.string().required(),
  routeName: Joi.string().required(),
  startingPoint: Joi.string().required(),
  endingPoint: Joi.string().required(),
  stops: Joi.array().items(Joi.string()).default([]),
  assignedBus: Joi.string().optional(),
  institution: Joi.string()
    .valid(...INSTITUTIONS)
    .optional()
});

const updateRouteSchema = createRouteSchema.min(1);

module.exports = { createRouteSchema, updateRouteSchema };
