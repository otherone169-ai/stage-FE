import express from "express";
import { createReport, listReports, validateReport } from "../controllers/reportController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { createReportSchema, validateReportSchema } from "../validations/reportValidation.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "supervisor", "intern"), listReports);
router.post("/", authorize("intern"), validate(createReportSchema), createReport);
router.patch(
  "/:id/validate",
  authorize("admin", "supervisor"),
  validate(validateReportSchema),
  validateReport
);

export default router;
