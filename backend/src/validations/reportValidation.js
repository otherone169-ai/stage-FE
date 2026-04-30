import Joi from "joi";

export const createReportSchema = Joi.object({
  taskId: Joi.number().integer().positive().allow(null),
  weekStart: Joi.date().iso().required(),
  weekEnd: Joi.date().iso().required(),
  content: Joi.string().min(10).max(5000).required()
});

export const validateReportSchema = Joi.object({
  status: Joi.string().valid("validated", "rejected").required(),
  feedback: Joi.string().max(1500).allow("", null)
});
