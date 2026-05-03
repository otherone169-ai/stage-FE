import express from "express";
import { 
  createProject, 
  listProjects,
  assignInternToProject,
  getMyAssignedProject
} from "../../controllers/v2/projectController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { createProjectSchema } from "../../validations/v2/projectValidation.js";

const router = express.Router();

// Supervisor routes
router.use(authenticate);
router.get("/", authorize("supervisor"), listProjects);
router.post("/", authorize("supervisor"), validate(createProjectSchema), createProject);
router.post("/assign-intern", authorize("supervisor"), assignInternToProject);

// Student routes
router.get("/my-assigned-project", authorize("student"), getMyAssignedProject);

export default router;
