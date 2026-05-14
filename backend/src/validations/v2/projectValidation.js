import Joi from "joi";

export const createProjectSchema = Joi.object({
  title: Joi.string().trim().max(180).required(),
  description: Joi.string().trim().allow("").optional(),
  objectives: Joi.string().trim().allow("").optional(),
  location: Joi.string().trim().allow("").optional(),
  duration: Joi.string().trim().allow("").optional(),
  domain: Joi.string().trim().allow("").optional(),
  requirements: Joi.string().trim().allow("").optional(),
  tasks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().max(180).required(),
        description: Joi.string().trim().allow("").optional()
      })
    )
    .optional()
});
