import express from "express";
import {
  assignSupervisor,
  createIntern,
  deleteIntern,
  getInternById,
  listInterns,
  updateIntern
} from "../controllers/internController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  assignSupervisorSchema,
  createInternSchema,
  updateInternSchema
} from "../validations/internValidation.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "supervisor"), listInterns);
router.get("/:id", authorize("admin", "supervisor", "intern"), getInternById);
router.post("/", authorize("admin", "supervisor"), validate(createInternSchema), createIntern);
router.put("/:id", authorize("admin", "supervisor"), validate(updateInternSchema), updateIntern);
router.delete("/:id", authorize("admin"), deleteIntern);
router.patch(
  "/:id/assign-supervisor",
  authorize("admin", "supervisor"),
  validate(assignSupervisorSchema),
  assignSupervisor
);

export default router;
