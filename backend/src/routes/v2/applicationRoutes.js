import express from "express";
import {
  applyToInternship,
  assignSupervisor,
  listApplicants,
  reviewApplication
} from "../../controllers/v2/applicationController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  applySchema,
  assignSupervisorSchema,
  reviewApplicationSchema
} from "../../validations/v2/applicationValidation.js";
import { sensitiveLimiter } from "../../middlewares/rateLimit.js";

const router = express.Router();

router.post("/", sensitiveLimiter, authenticate, authorize("student"), validate(applySchema), applyToInternship);
router.get("/internships/:internshipId/applicants", authenticate, authorize("company"), listApplicants);
router.patch(
  "/:applicationId/review",
  sensitiveLimiter,
  authenticate,
  authorize("company"),
  validate(reviewApplicationSchema),
  reviewApplication
);
router.patch(
  "/interns/:internId/assign-supervisor",
  sensitiveLimiter,
  authenticate,
  authorize("company"),
  validate(assignSupervisorSchema),
  assignSupervisor
);

export default router;
