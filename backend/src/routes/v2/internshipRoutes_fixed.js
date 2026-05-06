import express from "express";
import {
  searchInternships,
  createInternship,
  updateInternship,
  updateInternshipStatus,
  moderateInternship,
  listMyInternships,
  getInternshipById,
  applyToInternship,
  getMyApplications
} from "../controllers/v2/internshipController_fixed.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (students and supervisors can search)
router.get("/search", searchInternships);
router.get("/my-applications", getMyApplications);

// Student routes
router.post("/:id/apply", applyToInternship);

// Supervisor routes
router.post("/", requireRole("supervisor"), createInternship);
router.get("/my", requireRole("supervisor"), listMyInternships);
router.put("/:id", requireRole("supervisor"), updateInternship);
router.patch("/:id/status", requireRole("supervisor"), updateInternshipStatus);

// Admin routes
router.patch("/:id/moderate", requireRole("admin"), moderateInternship);

// Common routes
router.get("/:id", getInternshipById);

export default router;
