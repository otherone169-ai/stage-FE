import express from "express";
import {
  listProjects,
  createProject,
  assignInternToProject,
  getMyAssignedProject,
  deleteProject
} from "../controllers/v2/projectController_fixed.js";
import { authenticateToken } from "../../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Supervisor routes
router.get("/", listProjects);
router.post("/", createProject);
router.post("/assign", assignInternToProject);
router.delete("/:id", deleteProject);

// Student routes
router.get("/my-assigned", getMyAssignedProject);

export default router;
