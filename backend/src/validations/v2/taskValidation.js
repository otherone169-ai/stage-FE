import Joi from "joi";

export const createTaskSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  title: Joi.string().max(180).required(),
  description: Joi.string().max(3000),
  deadline: Joi.date()
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().max(180),
  description: Joi.string().max(3000),
  deadline: Joi.date(),
  status: Joi.string().valid("todo", "in_progress", "done")
});

export const createRemarkSchema = Joi.object({
  content: Joi.string().max(3000).required()
});
