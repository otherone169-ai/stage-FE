import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try later." }
});

export const sensitiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests on sensitive endpoint." }
});

// MEDIUM FIX #6: Add specific rate limits for critical endpoints
export const internCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 intern creations per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many intern creation attempts, please try later." }
});

export const projectCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Max 20 project creations per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many project creation attempts, please try later." }
});

export const fileUploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 file uploads per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many file upload attempts, please try later." }
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset attempts, please try later." }
});

export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 email verification requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many email verification attempts, please try later." }
});
