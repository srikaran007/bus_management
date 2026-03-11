const Joi = require("joi");

const markAttendanceSchema = Joi.object({
  date: Joi.date().required(),
  attendanceType: Joi.string().valid("Morning", "Evening").required(),
  subjectType: Joi.string().valid("Driver", "Student").required(),
  subjectId: Joi.string().required(),
  status: Joi.string().valid("Present", "Absent", "Leave").required()
});

const createEntryExitSchema = Joi.object({
  busNumber: Joi.string().required(),
  driverName: Joi.string().required(),
  route: Joi.string().required(),
  entryTime: Joi.date().required(),
  exitTime: Joi.date().optional()
});

module.exports = { markAttendanceSchema, createEntryExitSchema };
