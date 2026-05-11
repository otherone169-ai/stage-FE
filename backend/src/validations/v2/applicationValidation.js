import Joi from "joi";

export const applySchema = Joi.object({
  internshipId: Joi.string().uuid().required(),
  coverLetter: Joi.string().max(5000).allow("", null)
});

export const reviewApplicationSchema = Joi.object({
  status: Joi.string().valid("accepted", "rejected").required(),
  reviewerNotes: Joi.string().max(3000).allow("", null),
  projectId: Joi.string().uuid().allow(null),
  projectTitle: Joi.string().max(180).allow("", null),
  projectDescription: Joi.string().max(3000).allow("", null),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).allow(null)
});

export const assignSupervisorSchema = Joi.object({
  supervisorId: Joi.string().uuid().required()
});
