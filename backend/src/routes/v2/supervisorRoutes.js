import express from "express";
import {
  listSupervisors,
  getSupervisorDetails,
  updateSupervisor,
  deleteSupervisor,
  getMyProfile,
  updateMyProfile,
  listMyInterns,
  listCompanyInternships,
  getInternDetails,
  addInternFeedback,
  updateInternStatus
} from "../../controllers/v2/supervisorController.js";
import { listStudents } from "../../controllers/v2/studentController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  updateSupervisorSchema,
  internFeedbackSchema,
  updateInternStatusSchema
} from "../../validations/v2/supervisorValidation.js";

const router = express.Router();

router.get("/profile/me", authenticate, authorize("supervisor"), getMyProfile);
router.patch("/profile/me", authenticate, authorize("supervisor"), validate(updateSupervisorSchema), updateMyProfile);

router.get("/interns/list", authenticate, authorize("supervisor"), listMyInterns);
router.get("/students", authenticate, authorize("supervisor"), listStudents);
router.get("/internships/list", authenticate, authorize("supervisor"), listCompanyInternships);
router.get("/interns/:internId", authenticate, authorize("supervisor"), getInternDetails);
router.patch(
  "/interns/:internId/status",
  authenticate,
  authorize("supervisor"),
  validate(updateInternStatusSchema),
  updateInternStatus
);

router.post("/interns/:internId/feedback", authenticate, authorize("supervisor"), validate(internFeedbackSchema), addInternFeedback);

// ===== COMPANY RH ROUTES (manage supervisors) =====
router.get("/", authenticate, authorize("admin"), listSupervisors);
router.get("/:id", authenticate, authorize("admin"), getSupervisorDetails);
router.patch("/:id", authenticate, authorize("admin"), validate(updateSupervisorSchema), updateSupervisor);
router.delete("/:id", authenticate, authorize("admin"), deleteSupervisor);

export default router;
