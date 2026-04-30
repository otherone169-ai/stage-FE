import express from "express";
import {
  getMyCompanyProfile,
  monitorInterns,
  updateCompanyInternStatus,
  updateMyCompanyProfile
} from "../../controllers/v2/companyController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  updateCompanyInternStatusSchema,
  updateCompanySchema
} from "../../validations/v2/companyValidation.js";

const router = express.Router();

router.use(authenticate, authorize("company"));

router.get("/me", getMyCompanyProfile);
router.put("/me", validate(updateCompanySchema), updateMyCompanyProfile);
router.get("/interns/monitor", monitorInterns);
router.patch("/interns/:internId/status", validate(updateCompanyInternStatusSchema), updateCompanyInternStatus);

export default router;
