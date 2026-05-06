import express from "express";
import { query } from "../../config/db.js";
import { authenticateToken, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get tasks for a project (supervisor only)
router.get("/project/:projectId", requireRole("supervisor"), async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Verify project belongs to supervisor
    const projectCheck = await query(
      "SELECT id FROM projects WHERE id = $1 AND supervisor_id = $2",
      [req.params.projectId, supervisor.rows[0].id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: "Project not found or not authorized" });
    }

    const result = await query(
      `SELECT t.*, 
              COUNT(DISTINCT tu.id) as update_count,
              COUNT(DISTINCT CASE WHEN tu.status = 'done' THEN tu.id END) as completed_count,
              COUNT(DISTINCT intern.id) as assigned_interns
       FROM tasks t
       LEFT JOIN task_updates tu ON tu.task_id = t.id
       LEFT JOIN interns intern ON intern.project_id = t.project_id
       WHERE t.project_id = $1
       GROUP BY t.id
       ORDER BY t.created_at ASC`,
      [req.params.projectId]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

// Create task for a project (supervisor only)
router.post("/project/:projectId", requireRole("supervisor"), async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Verify project belongs to supervisor
    const projectCheck = await query(
      "SELECT id FROM projects WHERE id = $1 AND supervisor_id = $2",
      [req.params.projectId, supervisor.rows[0].id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: "Project not found or not authorized" });
    }

    const { title, description, deadline } = req.body;

    const result = await query(
      `INSERT INTO tasks (project_id, title, description, deadline, status)
       VALUES ($1, $2, $3, $4, 'todo')
       RETURNING *`,
      [req.params.projectId, title.trim(), description?.trim() || null, deadline || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

// Update task (supervisor only)
router.put("/:id", requireRole("supervisor"), async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Verify task belongs to supervisor's project
    const taskCheck = await query(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [req.params.id, supervisor.rows[0].id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found or not authorized" });
    }

    const { title, description, deadline, status } = req.body;

    const result = await query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           deadline = COALESCE($3, deadline),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title?.trim() || null, description?.trim() || null, deadline || null, status || null, req.params.id]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

// Delete task (supervisor only)
router.delete("/:id", requireRole("supervisor"), async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Verify task belongs to supervisor's project
    const taskCheck = await query(
      `SELECT t.id, t.title
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [req.params.id, supervisor.rows[0].id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found or not authorized" });
    }

    await query("DELETE FROM tasks WHERE id = $1", [req.params.id]);

    return res.json({
      message: "Task deleted successfully",
      task: { id: req.params.id, title: taskCheck.rows[0].title }
    });
  } catch (error) {
    return next(error);
  }
});

// Get task updates for a task (supervisor only) - Task updates tracking
router.get("/:id/updates", requireRole("supervisor"), async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Verify task belongs to supervisor's project
    const taskCheck = await query(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [req.params.id, supervisor.rows[0].id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found or not authorized" });
    }

    const result = await query(
      `SELECT tu.*, 
              st.full_name as student_name, 
              u.email as student_email,
              intern.status as intern_status
       FROM task_updates tu
       JOIN interns intern ON intern.id = tu.intern_id
       JOIN students st ON st.id = intern.student_id
       JOIN users u ON u.id = st.user_id
       WHERE tu.task_id = $1
       ORDER BY tu.created_at DESC`,
      [req.params.id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

// Get task updates for current student (Task updates tracking by intern_id)
router.get("/my-updates", requireRole("student"), async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const result = await query(
      `SELECT tu.*, 
              t.title as task_title,
              t.description as task_description,
              p.title as project_title
       FROM task_updates tu
       JOIN tasks t ON t.id = tu.task_id
       JOIN projects p ON p.id = t.project_id
       JOIN interns intern ON intern.id = tu.intern_id
       WHERE intern.student_id = $1
       ORDER BY tu.created_at DESC`,
      [student.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

// Update task progress (Task updates tracking by intern_id)
router.patch("/:id/progress", requireRole("student"), async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const { progress, status, fileUrl } = req.body;
    const taskId = req.params.id;

    // Verify task belongs to student's active project
    const taskCheck = await query(
      `SELECT t.id, i.id as intern_id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN interns i ON i.project_id = p.id
       WHERE t.id = $1 AND i.student_id = $2 AND i.status = 'active'`,
      [taskId, student.rows[0].id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found or not authorized" });
    }

    const result = await query(
      `INSERT INTO task_updates (task_id, intern_id, progress, status, file_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (task_id, intern_id) 
       DO UPDATE SET 
         progress = EXCLUDED.progress,
         status = EXCLUDED.status,
         file_url = EXCLUDED.file_url,
         updated_at = NOW()
       RETURNING *`,
      [taskId, taskCheck.rows[0].intern_id, progress || null, status || 'todo', fileUrl || null]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

// Add remark to task (supervisor only)
router.post("/:id/remarks", requireRole("supervisor"), async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Verify task belongs to supervisor's project
    const taskCheck = await query(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [req.params.id, supervisor.rows[0].id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found or not authorized" });
    }

    const { content } = req.body;

    const result = await query(
      `INSERT INTO task_remarks (task_id, supervisor_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, supervisor.rows[0].id, content.trim()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

// Get remarks for a task (supervisor only)
router.get("/:id/remarks", requireRole("supervisor"), async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Verify task belongs to supervisor's project
    const taskCheck = await query(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [req.params.id, supervisor.rows[0].id]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: "Task not found or not authorized" });
    }

    const result = await query(
      `SELECT tr.*, 
              s.full_name as supervisor_name, 
              u.email as supervisor_email
       FROM task_remarks tr
       JOIN supervisors s ON s.id = tr.supervisor_id
       JOIN users u ON u.id = s.user_id
       WHERE tr.task_id = $1
       ORDER BY tr.created_at DESC`,
      [req.params.id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

// Get all task updates for a specific intern across all tasks (Task updates tracking)
router.get("/intern/:internId/updates", requireRole("supervisor"), async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const internId = req.params.internId;

    // Verify intern belongs to supervisor's project
    const internCheck = await query(
      `SELECT i.id
       FROM interns i
       JOIN projects p ON p.id = i.project_id
       WHERE i.id = $1 AND p.supervisor_id = $2`,
      [internId, supervisor.rows[0].id]
    );

    if (internCheck.rows.length === 0) {
      return res.status(404).json({ message: "Intern not found or not authorized" });
    }

    const result = await query(
      `SELECT tu.*, 
              t.title as task_title,
              p.title as project_title,
              st.full_name as student_name,
              u.email as student_email
       FROM task_updates tu
       JOIN tasks t ON t.id = tu.task_id
       JOIN projects p ON p.id = t.project_id
       JOIN interns intern ON intern.id = tu.intern_id
       JOIN students st ON st.id = intern.student_id
       JOIN users u ON u.id = st.user_id
       WHERE tu.intern_id = $1
       ORDER BY tu.created_at DESC`,
      [internId]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

export default router;
