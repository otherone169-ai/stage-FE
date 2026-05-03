import Joi from "joi";

export const createProjectSchema = Joi.object({
  internshipId: Joi.string().uuid().required(),
  title: Joi.string().trim().max(180).required(),
  description: Joi.string().trim().allow("").optional(),
  objectives: Joi.string().trim().allow("").optional(),
  tasks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().max(180).required(),
        description: Joi.string().trim().allow("").optional()
      })
    )
    .min(1)
    .required()
});