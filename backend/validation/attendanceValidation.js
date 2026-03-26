const Joi = require("joi");

const markAttendanceSchema = Joi.object({
  date: Joi.date().required(),
  attendanceType: Joi.string().valid("Morning", "Evening").required(),
  subjectType: Joi.string().valid("Driver", "Student").required(),
  subjectId: Joi.string().required(),
  status: Joi.string().valid("Present", "Absent", "Leave").required()
});

const baseEntryExitFields = {
  busNumber: Joi.string().required(),
  driverName: Joi.string().required(),
  route: Joi.string().required()
};

const createEntryExitSchema = Joi.alternatives().try(
  Joi.object({
    ...baseEntryExitFields,
    entryTime: Joi.date().required(),
    exitTime: Joi.date().optional()
  }),
  Joi.object({
    ...baseEntryExitFields,
    eventType: Joi.string().valid("entry", "exit", "Entry", "Exit").required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  })
);

const busGpsPingSchema = Joi.object({
  busNumber: Joi.string().required(),
  driverName: Joi.string().required(),
  route: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  capturedAt: Joi.date().optional()
});

module.exports = { markAttendanceSchema, createEntryExitSchema, busGpsPingSchema };
