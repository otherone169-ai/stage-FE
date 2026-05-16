import express from "express";
import { 
  createProject, 
  listProjects,
  assignInternToProject,
  assignInternsToProject,
  getMyAssignedProject,
  getProjectInterns,
  deleteProject
} from "../../controllers/v2/projectController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { createProjectSchema } from "../../validations/v2/projectValidation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Student routes (before /:id to avoid param conflicts)
router.get("/my-assigned", authorize("student"), getMyAssignedProject);

// Supervisor routes
router.get("/", authorize("supervisor"), listProjects);
router.post("/", authorize("supervisor"), validate(createProjectSchema), createProject);
router.post("/assign", authorize("supervisor"), assignInternToProject);
router.post("/assign-multiple", authorize("supervisor"), assignInternsToProject);
router.get("/:id/interns", authorize("supervisor"), getProjectInterns);
router.delete("/:id", authorize("supervisor"), deleteProject);

export default router;
