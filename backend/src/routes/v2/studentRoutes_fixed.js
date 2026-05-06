import express from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  getMyInternships,
  getMyApplications,
  withdrawApplication,
  getMyTasks,
  updateTaskProgress,
  getMyReports,
  createReport,
  updateReport,
  submitReport
} from "../controllers/v2/studentController_fixed.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// Apply authentication and role check to all routes
router.use(authenticateToken);
router.use(requireRole("student"));

// Student profile
router.get("/profile", getStudentProfile);
router.put("/profile", updateStudentProfile);

// Internship management
router.get("/internships", getMyInternships);
router.get("/applications", getMyApplications);
router.patch("/applications/:id/withdraw", withdrawApplication);

// Task management
router.get("/tasks", getMyTasks);
router.patch("/tasks/:id/progress", updateTaskProgress);

// Report management
router.get("/reports", getMyReports);
router.post("/reports", createReport);
router.put("/reports/:id", updateReport);
router.patch("/reports/:id/submit", submitReport);

export default router;
