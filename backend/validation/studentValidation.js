const Joi = require("joi");

const createStudentSchema = Joi.object({
  studentName: Joi.string().required(),
  registerNumber: Joi.string().required(),
  department: Joi.string().optional(),
  busNumber: Joi.string().optional(),
  routeName: Joi.string().optional(),
  boardingPoint: Joi.string().optional(),
  user: Joi.string().optional()
});

const updateStudentSchema = createStudentSchema.min(1);

module.exports = { createStudentSchema, updateStudentSchema };
