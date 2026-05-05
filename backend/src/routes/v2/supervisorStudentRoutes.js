import express from "express";
import { listStudents } from "../../controllers/v2/studentController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Supervisor routes for students management
router.use(authenticate, authorize("supervisor"));

router.get("/students", listStudents);

export default router;
