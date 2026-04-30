import express from "express";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  updateTaskStatus
} from "../controllers/taskController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema
} from "../validations/taskValidation.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "supervisor", "intern"), listTasks);
router.post("/", authorize("admin", "supervisor"), validate(createTaskSchema), createTask);
router.put("/:id", authorize("admin", "supervisor"), validate(updateTaskSchema), updateTask);
router.patch(
  "/:id/status",
  authorize("admin", "supervisor", "intern"),
  validate(updateTaskStatusSchema),
  updateTaskStatus
);
router.delete("/:id", authorize("admin", "supervisor"), deleteTask);

export default router;
