import Joi from "joi";

export const createInternshipSchema = Joi.object({
  title: Joi.string().min(2).max(180).required(),
  description: Joi.string().min(10).max(6000).required(),
  location: Joi.string().max(140).allow("", null),
  duration: Joi.string().max(80).allow("", null),
  domain: Joi.string().max(120).allow("", null),
  requirements: Joi.string().max(5000).allow("", null),
  requiredSkills: Joi.array().items(Joi.string().trim().min(1).max(40)).max(80)
});

export const updateInternshipSchema = Joi.object({
  title: Joi.string().min(2).max(180),
  description: Joi.string().min(10).max(6000),
  location: Joi.string().max(140).allow("", null),
  duration: Joi.string().max(80).allow("", null),
  domain: Joi.string().max(120).allow("", null),
  requirements: Joi.string().max(5000).allow("", null),
  requiredSkills: Joi.array().items(Joi.string().trim().min(1).max(40)).max(80)
}).min(1);

export const internshipStatusSchema = Joi.object({
  isActive: Joi.boolean().required()
});

export const moderateInternshipSchema = Joi.object({
  moderationStatus: Joi.string().valid("approved", "rejected", "pending").required()
});
