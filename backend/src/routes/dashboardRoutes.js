import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/stats", authenticate, authorize("admin", "supervisor", "intern"), getDashboardStats);

export default router;