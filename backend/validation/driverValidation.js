const Joi = require("joi");
const { INSTITUTIONS } = require("../utils/constants");

const createDriverSchema = Joi.object({
  driverName: Joi.string().required(),
  driverId: Joi.string().required(),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  licenseNumber: Joi.string().required(),
  experience: Joi.string().optional(),
  assignedBus: Joi.string().optional(),
  institution: Joi.string()
    .valid(...INSTITUTIONS)
    .optional(),
  status: Joi.string().valid("Active", "Inactive", "Leave").optional()
});

const updateDriverSchema = createDriverSchema.min(1);

module.exports = { createDriverSchema, updateDriverSchema };
