import Joi from "joi";

const dateField = Joi.date().iso().allow(null);
const durationField = Joi.number().integer().positive().max(260).allow(null);

export const createInternshipSchema = Joi.object({
  title: Joi.string().min(2).max(180).required(),
  description: Joi.string().min(10).max(6000).required(),
  location: Joi.string().max(140).allow("", null),
  domain: Joi.string().max(120).allow("", null),
  startDate: dateField,
  endDate: dateField,
  start_date: dateField,
  end_date: dateField,
  durationWeeks: durationField,
  duration_weeks: durationField
});

export const updateInternshipSchema = Joi.object({
  title: Joi.string().min(2).max(180),
  description: Joi.string().min(10).max(6000),
  location: Joi.string().max(140).allow("", null),
  domain: Joi.string().max(120).allow("", null),
  startDate: dateField,
  endDate: dateField,
  start_date: dateField,
  end_date: dateField,
  durationWeeks: durationField,
  duration_weeks: durationField
}).min(1);

export const internshipStatusSchema = Joi.object({
  isActive: Joi.boolean().required()
});

export const moderateInternshipSchema = Joi.object({
  moderationStatus: Joi.string().valid("approved", "rejected", "pending").required()
});
