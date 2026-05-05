import Joi from "joi";

export const createSupervisorSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().max(140).required(),
  companyId: Joi.string().uuid().required(),
  position: Joi.string().max(140).allow("", null)
});

export const updateSupervisorSchema = Joi.object({
  fullName: Joi.string().max(140),
  position: Joi.string().max(140).allow("", null)
});

export const internFeedbackSchema = Joi.object({
  comment: Joi.string().max(3000).required()
});

export const updateInternStatusSchema = Joi.object({
  status: Joi.string().valid("active", "paused", "completed").required()
});

export const addStudentToInternshipSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Un email valide est requis",
    "any.required": "Email est obligatoire"
  }),
  fullName: Joi.string().max(140).optional(),
  phone: Joi.string().max(20).optional().allow("", null),
  education: Joi.string().max(500).optional().allow("", null),
  skills: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  experience: Joi.string().max(1000).optional().allow("", null),
  startDate: Joi.date().iso().optional().allow(null),
  // CRITICAL FIX #3: Validate endDate >= startDate
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .allow(null)
    .messages({
      "date.min": "End date must be on or after start date"
    }),
  projectId: Joi.string().optional().allow("", null),
  studentId: Joi.string().optional().allow("", null)
});
