import express from "express";
import { listProjects } from "../../controllers/v2/projectController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate, authorize("supervisor"));

router.get("/", listProjects);

export default router;
