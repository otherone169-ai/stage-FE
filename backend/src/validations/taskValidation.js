import Joi from "joi";

export const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(160).required(),
  description: Joi.string().max(1500).allow("", null),
  internId: Joi.number().integer().positive().required(),
  dueDate: Joi.date().iso().allow(null)
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(160),
  description: Joi.string().max(1500).allow("", null),
  internId: Joi.number().integer().positive(),
  dueDate: Joi.date().iso().allow(null),
  status: Joi.string().valid("todo", "in_progress", "done")
}).min(1);

export const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid("todo", "in_progress", "done").required()
});
