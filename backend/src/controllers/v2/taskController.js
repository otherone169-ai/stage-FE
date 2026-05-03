import { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

const hasTaskAccess = async (taskId, user) => {
  if (user.role === "supervisor") {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [user.id]);
    if (supervisor.rows.length === 0) {
      return false;
    }

    const task = await query(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [taskId, supervisor.rows[0].id]
    );

    return task.rows.length > 0;
  }

  if (user.role === "student") {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [user.id]);
    if (student.rows.length === 0) {
      return false;
    }

    const task = await query(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN interns i ON i.project_id = p.id
       WHERE t.id = $1 AND i.student_id = $2`,
      [taskId, student.rows[0].id]
    );

    return task.rows.length > 0;
  }

  return false;
};

// ===== NOTIFICATION HELPERS =====

const notifyProjectInterns = async (projectId, notificationType, taskTitle, taskId, excludeUserId = null) => {
  try {
    // Get all interns in the project
    const interns = await query(
      `SELECT DISTINCT i.student_id, s.user_id, u.email
       FROM interns i
       JOIN students s ON s.id = i.student_id
       JOIN users u ON u.id = s.user_id
       WHERE i.project_id = $1`,
      [projectId]
    );

    // Get project and internship info
    const project = await query(
      `SELECT p.title, intp.title as internship_title
       FROM projects p
       JOIN internships intp ON intp.id = p.internship_id
       WHERE p.id = $1`,
      [projectId]
    );

    if (project.rows.length === 0) return;

    const projectTitle = project.rows[0].title;
    let notificationMessage = "";
    let actionType = "";

    if (notificationType === "task_created") {
      actionType = "créée";
      notificationMessage = `Nouvelle tâche: "${taskTitle}" dans le projet "${projectTitle}"`;
    } else if (notificationType === "task_updated") {
      actionType = "mise à jour";
      notificationMessage = `La tâche "${taskTitle}" a été mise à jour dans le projet "${projectTitle}"`;
    }

    const linkUrl = `/app/tasks/${taskId}`;

    // Insert notification for each intern
    for (const intern of interns.rows) {
      if (excludeUserId && intern.user_id === excludeUserId) {
        continue;
      }

      await query(
        `INSERT INTO notifications (user_id, type, message, link_url, is_read)
         VALUES ($1, $2, $3, $4, FALSE)`,
        [intern.user_id, notificationType, notificationMessage, linkUrl]
      );
    }
  } catch (error) {
    console.error("Error notifying interns:", error);
    // Don't throw - notification failure shouldn't block task operations
  }
};

// ===== SUPERVISOR TASK MANAGEMENT =====

export const createTask = async (req, res, next) => {
  try {
    const { projectId, title, description, deadline } = req.body;

    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    // Verify project belongs to supervisor
    const project = await query(
      "SELECT id FROM projects WHERE id = $1 AND supervisor_id = $2",
      [projectId, supervisor.rows[0].id]
    );
    if (project.rows.length === 0) {
      return res.status(403).json({ message: "Project not found or not assigned to you" });
    }

    const result = await query(
      `INSERT INTO tasks (project_id, title, description, deadline, status)
       VALUES ($1, $2, $3, $4, 'todo')
       RETURNING *`,
      [projectId, title, description || null, deadline || null]
    );

    await logAudit(req.user.id, "TASK_CREATED", { taskId: result.rows[0].id });

    // Notify all interns in the project about task creation
    await notifyProjectInterns(projectId, "task_created", title, result.rows[0].id);

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const listTasks = async (req, res, next) => {
  try {
    let where = [];
    let values = [];

    // Role-based filtering
    if (req.user.role === "supervisor") {
      const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisor.rows.length === 0) {
        return res.status(404).json({ message: "Supervisor profile not found" });
      }
      where.push(`p.supervisor_id = $${values.length + 1}`);
      values.push(supervisor.rows[0].id);
    } else if (req.user.role === "student") {
      const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
      if (student.rows.length === 0) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      where.push(`i.student_id = $${values.length + 1}`);
      values.push(student.rows[0].id);
    }

    // Filter by status
    if (req.query.status) {
      where.push(`t.status = $${values.length + 1}`);
      values.push(req.query.status);
    }

    // Filter by project
    if (req.query.projectId) {
      where.push(`p.id = $${values.length + 1}`);
      values.push(req.query.projectId);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const result = await query(
      `SELECT 
        t.id, t.project_id, t.title, t.description, t.deadline, t.status, t.created_at, t.updated_at,
        p.title as project_title,
        intp.title as internship_title,
        COUNT(DISTINCT tr.id) as remark_count
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN internships intp ON intp.id = p.internship_id
      LEFT JOIN interns i ON i.project_id = p.id
      LEFT JOIN task_remarks tr ON tr.task_id = t.id
      ${whereClause}
      GROUP BY t.id, t.project_id, t.title, t.description, t.deadline, t.status, t.created_at, t.updated_at, p.title, intp.title
      ORDER BY t.deadline ASC, t.created_at DESC`,
      values
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getTaskDetails = async (req, res, next) => {
  try {
    const hasAccess = await hasTaskAccess(req.params.id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: "Task not found or not assigned to you" });
    }

    const task = await query(
      `SELECT 
        t.id, t.project_id, t.title, t.description, t.deadline, t.status, t.created_at, t.updated_at,
        p.id as project_id, p.title as project_title,
        intp.title as internship_title,
        COUNT(DISTINCT tr.id) as remark_count
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN internships intp ON intp.id = p.internship_id
      LEFT JOIN task_remarks tr ON tr.task_id = t.id
      WHERE t.id = $1
      GROUP BY t.id, t.project_id, t.title, t.description, t.deadline, t.status, t.created_at, t.updated_at, p.title, intp.title`,
      [req.params.id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Get remarks
    const remarks = await query(
      `SELECT 
        tr.id, tr.content, tr.created_at, tr.updated_at,
        u.email,
        CASE WHEN u.role = 'supervisor' THEN 'Supervisor' WHEN u.role = 'student' THEN 'Student' ELSE u.role END as user_role
      FROM task_remarks tr
      JOIN users u ON u.id = tr.user_id
      WHERE tr.task_id = $1
      ORDER BY tr.created_at DESC`,
      [req.params.id]
    );

    return res.json({
      ...task.rows[0],
      remarks: remarks.rows
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const task = await query(
      `SELECT t.* FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [req.params.id, supervisor.rows[0].id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Prevent status changes via updateTask - must use transition endpoints
    if (req.body.hasOwnProperty("status")) {
      return res.status(400).json({ 
        message: "Status cannot be modified here. Use /transition/start or /transition/done endpoints for state transitions." 
      });
    }

    // Check if any content changed (for notifications)
    const contentChanged = req.body.description !== undefined || req.body.deadline !== undefined;

    const result = await query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           deadline = COALESCE($3, deadline),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        req.body.title ?? null,
        req.body.description ?? null,
        req.body.deadline ?? null,
        req.params.id
      ]
    );

    await logAudit(req.user.id, "TASK_UPDATED", { taskId: req.params.id });

    // Notify interns about task update
    if (contentChanged) {
      await notifyProjectInterns(task.rows[0].project_id, "task_updated", result.rows[0].title, req.params.id);
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

// ===== TASK STATE MACHINE (Student Actions Only) =====

export const startTask = async (req, res, next) => {
  try {
    // Only students can start tasks
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can transition task status" });
    }

    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Get task and verify access + status
    const task = await query(
      `SELECT t.* FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN interns i ON i.project_id = p.id
       WHERE t.id = $1 AND i.student_id = $2`,
      [req.params.id, student.rows[0].id]
    );

    if (task.rows.length === 0) {
      return res.status(403).json({ message: "Task not found or not assigned to you" });
    }

    // Verify current status is 'todo'
    if (task.rows[0].status !== "todo") {
      return res.status(400).json({ 
        message: `Task cannot be started. Current status is '${task.rows[0].status}'. Only 'todo' tasks can be started.` 
      });
    }

    // Transition: todo -> in_progress
    const result = await query(
      `UPDATE tasks SET status = 'in_progress', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await logAudit(req.user.id, "TASK_STARTED", { taskId: req.params.id });

    // Notify other interns in the project
    await notifyProjectInterns(
      task.rows[0].project_id,
      "task_started",
      task.rows[0].title,
      req.params.id,
      req.user.id
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const finishTask = async (req, res, next) => {
  try {
    // Only students can finish tasks
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can transition task status" });
    }

    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Get task and verify access + status
    const task = await query(
      `SELECT t.* FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN interns i ON i.project_id = p.id
       WHERE t.id = $1 AND i.student_id = $2`,
      [req.params.id, student.rows[0].id]
    );

    if (task.rows.length === 0) {
      return res.status(403).json({ message: "Task not found or not assigned to you" });
    }

    // Verify current status is 'in_progress'
    if (task.rows[0].status !== "in_progress") {
      return res.status(400).json({ 
        message: `Task cannot be finished. Current status is '${task.rows[0].status}'. Only 'in_progress' tasks can be finished.` 
      });
    }

    // Transition: in_progress -> done
    const result = await query(
      `UPDATE tasks SET status = 'done', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await logAudit(req.user.id, "TASK_FINISHED", { taskId: req.params.id });

    // Notify other interns in the project
    await notifyProjectInterns(
      task.rows[0].project_id,
      "task_finished",
      task.rows[0].title,
      req.params.id,
      req.user.id
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

// DEPRECATED: Use startTask or finishTask instead
// Kept for backward compatibility but should not be used
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Both supervisor and student can update status
    if (req.user.role === "supervisor") {
      const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisor.rows.length === 0) {
        return res.status(404).json({ message: "Supervisor profile not found" });
      }

      const task = await query(
        `SELECT t.* FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE t.id = $1 AND p.supervisor_id = $2`,
        [req.params.id, supervisor.rows[0].id]
      );

      if (task.rows.length === 0) {
        return res.status(403).json({ message: "Task not found or not assigned to you" });
      }
    } else if (req.user.role === "student") {
      const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
      if (student.rows.length === 0) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const taskAccess = await query(
        `SELECT t.* FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN interns i ON i.project_id = p.id
         WHERE t.id = $1 AND i.student_id = $2`,
        [req.params.id, student.rows[0].id]
      );

      if (taskAccess.rows.length === 0) {
        return res.status(403).json({ message: "Task not found or not assigned to you" });
      }
    }

    const result = await query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    await logAudit(req.user.id, "TASK_STATUS_UPDATED", {
      taskId: req.params.id,
      status
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const task = await query(
      `SELECT t.* FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [req.params.id, supervisor.rows[0].id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    await query("DELETE FROM tasks WHERE id = $1", [req.params.id]);

    await logAudit(req.user.id, "TASK_DELETED", { taskId: req.params.id });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

// ===== TASK REMARKS (Comments) =====

export const addRemark = async (req, res, next) => {
  try {
    const { content } = req.body;

    const hasAccess = await hasTaskAccess(req.params.taskId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: "You don't have access to this task" });
    }

    const result = await query(
      `INSERT INTO task_remarks (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.taskId, req.user.id, content]
    );

    await logAudit(req.user.id, "TASK_REMARK_ADDED", { taskId: req.params.taskId });

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const listTaskRemarks = async (req, res, next) => {
  try {
    const hasAccess = await hasTaskAccess(req.params.taskId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: "Task not found or not assigned to you" });
    }

    const result = await query(
      `SELECT 
        tr.id, tr.task_id, tr.content, tr.created_at, tr.updated_at,
        u.email,
        CASE WHEN u.role = 'supervisor' THEN 'Supervisor' WHEN u.role = 'student' THEN 'Student' ELSE u.role END as user_role
      FROM task_remarks tr
      JOIN users u ON u.id = tr.user_id
      WHERE tr.task_id = $1
      ORDER BY tr.created_at DESC`,
      [req.params.taskId]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const deleteRemark = async (req, res, next) => {
  try {
    const remark = await query("SELECT * FROM task_remarks WHERE id = $1", [req.params.remarkId]);

    if (remark.rows.length === 0) {
      return res.status(404).json({ message: "Remark not found" });
    }

    const hasAccess = await hasTaskAccess(remark.rows[0].task_id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: "You cannot delete remarks outside your assigned tasks" });
    }

    if (remark.rows[0].user_id !== req.user.id) {
      if (req.user.role !== "supervisor") {
        return res.status(403).json({ message: "You can only delete your own remarks" });
      }

      const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisor.rows.length === 0) {
        return res.status(403).json({ message: "Supervisor profile not found" });
      }

      const ownership = await query(
        `SELECT tr.id
         FROM task_remarks tr
         JOIN tasks t ON t.id = tr.task_id
         JOIN projects p ON p.id = t.project_id
         WHERE tr.id = $1 AND p.supervisor_id = $2`,
        [req.params.remarkId, supervisor.rows[0].id]
      );

      if (ownership.rows.length === 0) {
        return res.status(403).json({ message: "You cannot delete remarks outside your assigned tasks" });
      }
    }

    await query("DELETE FROM task_remarks WHERE id = $1", [req.params.remarkId]);

    await logAudit(req.user.id, "TASK_REMARK_DELETED", { remarkId: req.params.remarkId });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
