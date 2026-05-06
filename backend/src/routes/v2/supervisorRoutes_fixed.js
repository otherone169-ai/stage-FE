import express from "express";
import {
  getSupervisorProfile,
  createStudent,
  getMyStudents,
  getAvailableStudents,
  updateStudent,
  deleteStudent,
  getStudentById
} from "../controllers/v2/supervisorController_fixed.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// Apply authentication and role check to all routes
router.use(authenticateToken);
router.use(requireRole("supervisor"));

// Supervisor profile
router.get("/profile", getSupervisorProfile);

// Student management
router.post("/students", createStudent);
router.get("/students", getMyStudents);
router.get("/students/available", getAvailableStudents);
router.get("/students/:id", getStudentById);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);

export default router;
