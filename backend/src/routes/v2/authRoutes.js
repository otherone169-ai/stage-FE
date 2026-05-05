import express from "express";
import {
  changePassword,
  login,
  me,
  register,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  verifyEmail
} from "../../controllers/v2/authController.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  requestResetSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "../../validations/v2/authValidation.js";
import { authLimiter, sensitiveLimiter, passwordResetLimiter, emailVerificationLimiter } from "../../middlewares/rateLimit.js";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/password/change", sensitiveLimiter, authenticate, validate(changePasswordSchema), changePassword);
router.post("/password-reset/request", passwordResetLimiter, validate(requestResetSchema), requestPasswordReset);
router.post("/password-reset/confirm", passwordResetLimiter, validate(resetPasswordSchema), resetPassword);
router.post("/email-verification/confirm", emailVerificationLimiter, validate(verifyEmailSchema), verifyEmail);
router.post(
  "/email-verification/request",
  emailVerificationLimiter,
  validate(resendVerificationSchema),
  resendVerificationEmail
);
router.get("/me", authenticate, me);

export default router;
