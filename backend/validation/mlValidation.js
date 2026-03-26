const Joi = require("joi");
const { INSTITUTIONS } = require("../utils/constants");

const generateScheduleSchema = Joi.object({
  institution: Joi.string().valid(...INSTITUTIONS).optional(),
  scheduleDate: Joi.date().iso().optional(),
  lookbackDays: Joi.number().integer().min(7).max(180).optional(),
  overwrite: Joi.boolean().optional()
});

const updateShiftStatusSchema = Joi.object({
  institution: Joi.string().valid(...INSTITUTIONS).optional(),
  status: Joi.string().valid("Planned", "InProgress", "Completed", "Cancelled").required(),
  notes: Joi.string().max(255).allow("", null).optional()
});

module.exports = {
  generateScheduleSchema,
  updateShiftStatusSchema
};
