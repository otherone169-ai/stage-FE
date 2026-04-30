import Joi from "joi";

export const applySchema = Joi.object({
  internshipId: Joi.string().uuid().required()
});

export const reviewApplicationSchema = Joi.object({
  status: Joi.string().valid("accepted", "rejected").required(),
  supervisorId: Joi.string().uuid().allow(null)
});

export const assignSupervisorSchema = Joi.object({
  supervisorId: Joi.string().uuid().required()
});
