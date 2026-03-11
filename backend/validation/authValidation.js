const Joi = require("joi");
const { ROLES } = require("../utils/constants");

const emailRule = Joi.string().email({ tlds: { allow: false } });

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: emailRule.required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string()
    .valid(ROLES.ADMIN, ROLES.TRANSPORT, ROLES.STAFF, ROLES.STUDENT, ROLES.DRIVER)
    .required(),
  phone: Joi.string().pattern(/^\d{10}$/).optional()
});

const loginSchema = Joi.object({
  email: emailRule.required(),
  password: Joi.string().required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: emailRule.required()
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).max(128).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
