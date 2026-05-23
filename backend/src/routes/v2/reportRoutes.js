import express from "express";
import {
  createReport,
  createReportPdf,
  downloadReportPdf,
  submitReport,
  listMyReports,
  getReportDetails,
  updateReport,
  validateReport,
  listReportsForValidation
} from "../../controllers/v2/reportController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { fileUploadLimiter } from "../../middlewares/rateLimit.js";
import { uploadPdf } from "../../middlewares/uploadMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import Joi from "joi";

const router = express.Router();

const createReportSchema = Joi.object({
  internId: Joi.string().uuid().required(),
  title: Joi.string().max(180).required(),
  content: Joi.string().max(10000).required()
});

const updateReportSchema = Joi.object({
  title: Joi.string().max(180),
  content: Joi.string().max(10000)
});

const validateReportSchema = Joi.object({
  status: Joi.string().valid("validated", "rejected").required(),
  feedback: Joi.string().max(3000).allow("", null)
});

// Student endpoints
router.post("/", authenticate, authorize("student"), validate(createReportSchema), createReport);
router.post(
  "/pdf",
  authenticate,
  authorize("student"),
  fileUploadLimiter,
  uploadPdf.single("pdf"),
  createReportPdf
);
router.get("/my", authenticate, authorize("student"), listMyReports);
router.get("/:id/pdf", authenticate, authorize("student", "supervisor"), downloadReportPdf);
router.patch("/:id", authenticate, authorize("student"), validate(updateReportSchema), updateReport);
router.patch("/:id/submit", authenticate, authorize("student"), submitReport);

// Supervisor endpoints
router.get("/validation/list", authenticate, authorize("supervisor"), listReportsForValidation);
router.patch("/:id/validate", authenticate, authorize("supervisor"), validate(validateReportSchema), validateReport);
router.get("/:id", authenticate, getReportDetails);

export default router;
