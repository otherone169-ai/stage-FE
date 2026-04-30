import Joi from "joi";

export const createSupervisorSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  department: Joi.string().max(120).allow("", null)
});

export const updateSupervisorSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  department: Joi.string().max(120).allow("", null)
}).min(1);
