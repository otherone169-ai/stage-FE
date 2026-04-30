import express from "express";
import {
  createTask,
  listTasks,
  getTaskDetails,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addRemark,
  listTaskRemarks,
  deleteRemark
} from "../../controllers/v2/taskController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { createTaskSchema, updateTaskSchema, createRemarkSchema } from "../../validations/v2/taskValidation.js";
import Joi from "joi";

const router = express.Router();
const updateStatusSchema = Joi.object({
  status: Joi.string().valid("todo", "in_progress", "done").required()
});

// Task CRUD (supervisor only for create/update/delete)
router.post("/", authenticate, authorize("supervisor"), validate(createTaskSchema), createTask);
router.get("/", authenticate, authorize("supervisor", "student"), listTasks);
router.get("/:id", authenticate, authorize("supervisor", "student"), getTaskDetails);
router.patch("/:id", authenticate, authorize("supervisor"), validate(updateTaskSchema), updateTask);
router.patch("/:id/status", authenticate, authorize("supervisor", "student"), validate(updateStatusSchema), updateTaskStatus);
router.delete("/:id", authenticate, authorize("supervisor"), deleteTask);

// Task Remarks (both supervisor and student)
router.post("/:taskId/remarks", authenticate, authorize("supervisor", "student"), validate(createRemarkSchema), addRemark);
router.get("/:taskId/remarks", authenticate, authorize("supervisor", "student"), listTaskRemarks);
router.delete("/remarks/:remarkId", authenticate, authorize("supervisor", "student"), deleteRemark);

export default router;
