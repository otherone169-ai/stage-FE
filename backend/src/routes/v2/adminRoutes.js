import express from "express";
import {
  deleteUser,
  listApplications,
  listCompanyRhProfiles,
  listStudentProfiles,
  listUsers,
  suspendUser
} from "../../controllers/v2/adminController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { suspendUserSchema } from "../../validations/v2/adminValidation.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/users", listUsers);
router.patch("/users/:userId/status", validate(suspendUserSchema), suspendUser);
router.delete("/users/:userId", deleteUser);
router.get("/applications", listApplications);
router.get("/companies-rh", listCompanyRhProfiles);
router.get("/students", listStudentProfiles);

export default router;
