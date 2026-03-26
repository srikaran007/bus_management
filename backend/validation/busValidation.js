const Joi = require("joi");
const { INSTITUTIONS } = require("../utils/constants");

const createBusSchema = Joi.object({
  busNumber: Joi.string().required(),
  busName: Joi.string().required(),
  model: Joi.string().optional(),
  institution: Joi.string()
    .valid(...INSTITUTIONS)
    .optional(),
  capacity: Joi.number().integer().min(1).required(),
  status: Joi.string().valid("Active", "Maintenance", "Idle").optional()
});

const updateBusSchema = createBusSchema.min(1);

module.exports = { createBusSchema, updateBusSchema };
