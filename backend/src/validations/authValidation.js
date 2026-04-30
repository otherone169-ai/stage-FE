import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid("admin", "supervisor", "intern").required(),
  department: Joi.string().max(120).allow("", null),
  school: Joi.string().max(120).allow("", null),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null)
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
