import Joi from "joi";

export const createSupervisorSchema = Joi.object({
  fullName: Joi.string().min(2).max(140).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  position: Joi.string().max(140).allow("", null),
  companyName: Joi.string().min(2).max(180).required(),
  companyDescription: Joi.string().max(2000).allow("", null),
  companyLocation: Joi.string().max(140).allow("", null),
  companyWebsite: Joi.string().uri().allow("", null)
});

export const updateSupervisorSchema = Joi.object({
  fullName: Joi.string().min(2).max(140),
  position: Joi.string().max(140).allow("", null),
  companyName: Joi.string().min(2).max(180),
  companyDescription: Joi.string().max(2000).allow("", null),
  companyLocation: Joi.string().max(140).allow("", null),
  companyWebsite: Joi.string().uri().allow("", null)
}).min(1);
