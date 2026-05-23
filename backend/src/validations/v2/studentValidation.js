import Joi from "joi";

export const updateStudentProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(140),
  phone: Joi.string().max(40).allow("", null),
  education: Joi.string().max(2000).allow("", null),
  experience: Joi.string().max(4000).allow("", null),
  skills: Joi.array().items(Joi.string().trim().min(1).max(40)).max(50),
  cvUrl: Joi.string().uri().allow("", null),
  preferences: Joi.object({
    location: Joi.string().max(140).allow("", null),
    domain: Joi.string().max(120).allow("", null),
    duration: Joi.string().max(80).allow("", null),
    skills: Joi.array().items(Joi.string().trim().min(1).max(40)).max(30)
  })
}).min(1);

export const taskUpdateSchema = Joi.object({
  progress: Joi.string().max(2000).allow("", null),
  status: Joi.string().valid("todo", "in_progress", "done").required(),
  fileUrl: Joi.string().max(500).allow("", null)
});
