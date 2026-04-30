import Joi from "joi";

export const createSupervisorSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().max(140).required(),
  companyId: Joi.string().uuid().required(),
  position: Joi.string().max(140).allow("", null)
});

export const updateSupervisorSchema = Joi.object({
  fullName: Joi.string().max(140),
  position: Joi.string().max(140).allow("", null)
});

export const internFeedbackSchema = Joi.object({
  comment: Joi.string().max(3000).required()
});

export const updateInternStatusSchema = Joi.object({
  status: Joi.string().valid("active", "paused", "completed").required()
});
