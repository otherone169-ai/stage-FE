import express from "express";
import {
  getMyCvDownloadToken,
  getMyProfile,
  getMyProgress,
  listMyApplications,
  submitTaskUpdate,
  uploadMyCv,
  updateMyProfile
} from "../../controllers/v2/studentController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { sensitiveLimiter } from "../../middlewares/rateLimit.js";
import { uploadCV } from "../../middlewares/uploadMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { taskUpdateSchema, updateStudentProfileSchema } from "../../validations/v2/studentValidation.js";

const router = express.Router();

router.use(authenticate, authorize("student"));

router.get("/me", getMyProfile);
router.put("/me", validate(updateStudentProfileSchema), updateMyProfile);
router.get("/applications", listMyApplications);
router.get("/progress", getMyProgress);
router.post("/tasks/:taskId/updates", validate(taskUpdateSchema), submitTaskUpdate);
router.post("/me/cv", sensitiveLimiter, uploadCV.single("cv"), uploadMyCv);
router.get("/me/cv/token", sensitiveLimiter, getMyCvDownloadToken);

export default router;
