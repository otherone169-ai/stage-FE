import Joi from "joi";

export const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(180),
  description: Joi.string().max(5000).allow("", null),
  location: Joi.string().max(140).allow("", null),
  website: Joi.string().uri().allow("", null)
}).min(1);

export const updateCompanyInternStatusSchema = Joi.object({
  status: Joi.string().valid("active", "paused", "completed", "terminated").required()
});
