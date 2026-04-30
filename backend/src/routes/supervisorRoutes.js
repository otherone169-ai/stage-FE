import express from "express";
import {
  createSupervisor,
  deleteSupervisor,
  listSupervisors,
  updateSupervisor
} from "../controllers/supervisorController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  createSupervisorSchema,
  updateSupervisorSchema
} from "../validations/supervisorValidation.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "supervisor"), listSupervisors);
router.post("/", authorize("admin"), validate(createSupervisorSchema), createSupervisor);
router.put("/:id", authorize("admin"), validate(updateSupervisorSchema), updateSupervisor);
router.delete("/:id", authorize("admin"), deleteSupervisor);

export default router;
