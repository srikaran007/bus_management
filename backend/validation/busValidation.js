const Joi = require("joi");

const createBusSchema = Joi.object({
  busNumber: Joi.string().required(),
  busName: Joi.string().required(),
  model: Joi.string().optional(),
  capacity: Joi.number().integer().min(1).required(),
  routeName: Joi.string().optional(),
  startingPoint: Joi.string().optional(),
  endingPoint: Joi.string().optional(),
  status: Joi.string().valid("Active", "Maintenance", "Idle").optional(),
  driver: Joi.string().optional()
});

const updateBusSchema = createBusSchema.min(1);

module.exports = { createBusSchema, updateBusSchema };
