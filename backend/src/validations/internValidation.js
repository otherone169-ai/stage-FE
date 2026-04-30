import Joi from "joi";

export const createInternSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  school: Joi.string().max(120).allow("", null),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
  supervisorId: Joi.number().integer().positive().allow(null)
});

export const updateInternSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  school: Joi.string().max(120).allow("", null),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
  supervisorId: Joi.number().integer().positive().allow(null)
}).min(1);

export const assignSupervisorSchema = Joi.object({
  supervisorId: Joi.number().integer().positive().required()
});
