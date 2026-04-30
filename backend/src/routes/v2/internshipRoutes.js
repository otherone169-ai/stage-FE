import express from "express";
import {
  createInternship,
  listMyInternships,
  moderateInternship,
  searchInternships,
  updateInternship,
  updateInternshipStatus
} from "../../controllers/v2/internshipController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  createInternshipSchema,
  internshipStatusSchema,
  moderateInternshipSchema,
  updateInternshipSchema
} from "../../validations/v2/internshipValidation.js";
import { sensitiveLimiter } from "../../middlewares/rateLimit.js";

const router = express.Router();

router.get("/", authenticate, searchInternships);

router.post(
  "/",
  sensitiveLimiter,
  authenticate,
  authorize("company"),
  validate(createInternshipSchema),
  createInternship
);
router.get("/my", authenticate, authorize("company"), listMyInternships);
router.patch(
  "/:id",
  sensitiveLimiter,
  authenticate,
  authorize("company"),
  validate(updateInternshipSchema),
  updateInternship
);
router.patch(
  "/:id/status",
  sensitiveLimiter,
  authenticate,
  authorize("company"),
  validate(internshipStatusSchema),
  updateInternshipStatus
);
router.patch(
  "/:id/moderation",
  authenticate,
  authorize("admin"),
  validate(moderateInternshipSchema),
  moderateInternship
);

export default router;
