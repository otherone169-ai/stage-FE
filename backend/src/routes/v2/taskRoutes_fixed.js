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
              COUNT(DISTINCT CASE WHEN tu.status = 'done' THEN tu.id END) as completed_count
       FROM tasks t
       LEFT JOIN task_updates tu ON tu.task_id = t.id
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

// Get task updates for a task (supervisor only)
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
      `SELECT tu.*, s.full_name as student_name, u.email as student_email
       FROM task_updates tu
       JOIN interns i ON i.id = tu.intern_id
       JOIN students s ON s.id = i.student_id
       JOIN users u ON u.id = s.user_id
       WHERE tu.task_id = $1
       ORDER BY tu.created_at DESC`,
      [req.params.id]
    );

    return res.json(result.rows);
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
      `SELECT tr.*, s.full_name as supervisor_name, u.email as supervisor_email
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

export default router;
