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

// I just flow the step 2
export const createCompanySupervisorSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().max(140).required(),
  position: Joi.string().max(140).allow("", null)
});
