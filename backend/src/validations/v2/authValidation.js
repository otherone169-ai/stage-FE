import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ minDomainSegments: 1, tlds: { allow: false } }).required(),
  password: Joi.string().min(8).max(128).required(),
  fullName: Joi.string().min(2).max(140).required(),
  companyName: Joi.string().min(2).max(180).required(),
  companyDescription: Joi.string().max(2000).allow("", null),
  companyLocation: Joi.string().max(140).allow("", null),
  companyWebsite: Joi.string().uri().allow("", null),
  position: Joi.string().min(2).max(140).allow("", null)
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ minDomainSegments: 1, tlds: { allow: false } }).required(),
  password: Joi.string().required()
});

export const requestResetSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ minDomainSegments: 1, tlds: { allow: false } }).required()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required()
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
});

export const resendVerificationSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ minDomainSegments: 1, tlds: { allow: false } }).required()
});
