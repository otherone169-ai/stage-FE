import express from "express";
import {
  getMyCompanyProfile,
  monitorInterns,
  updateCompanyInternStatus,
  updateMyCompanyProfile,
  listMySupervisors, //step 4
  createSupervisorForCompany//
} from "../../controllers/v2/companyController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  updateCompanyInternStatusSchema,
  updateCompanySchema,
  createCompanySupervisorSchema//step 4
} from "../../validations/v2/companyValidation.js";

const router = express.Router();

router.use(authenticate, authorize("company"));

router.get("/me", getMyCompanyProfile);
router.put("/me", validate(updateCompanySchema), updateMyCompanyProfile);
router.get("/interns/monitor", monitorInterns);
router.patch("/interns/:internId/status", validate(updateCompanyInternStatusSchema), updateCompanyInternStatus);
//step 4
router.get("/supervisors",listMySupervisors);
router.post("/supervisors",validate(createCompanySupervisorSchema),createSupervisorForCompany);
export default router;
