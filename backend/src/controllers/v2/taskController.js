import { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

const getSupervisorId = async (userId) => {
  const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [userId]);
  return supervisor.rows[0]?.id || null;
};

const getStudentId = async (userId) => {
  const student = await query("SELECT id FROM students WHERE user_id = $1", [userId]);
  return student.rows[0]?.id || null;
};

const hasTaskAccess = async (taskId, user) => {
  if (user.role === "supervisor") {
    const supervisorId = await getSupervisorId(user.id);
    if (!supervisorId) {
      return false;
    }

    const task = await query(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [taskId, supervisorId]
    );

    return task.rows.length > 0;
  }

  if (user.role === "student") {
    const studentId = await getStudentId(user.id);
    if (!studentId) {
      return false;
    }

    const task = await query(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN interns i ON i.project_id = p.id
       WHERE t.id = $1 AND i.student_id = $2`,
      [taskId, studentId]
    );

    return task.rows.length > 0;
  }

  return false;
};

const buildNotificationMessage = async (projectId, notificationType, taskTitle) => {
  const project = await query(
    `SELECT p.title
     FROM projects p
     WHERE p.id = $1`,
    [projectId]
  );

  const projectTitle = project.rows[0]?.title || "project";

  if (notificationType === "task_created") {
    return `New task "${taskTitle}" was added to project "${projectTitle}".`;
  }

  if (notificationType === "task_updated") {
    return `Task "${taskTitle}" was updated in project "${projectTitle}".`;
  }

  if (notificationType === "task_started") {
    return `Task "${taskTitle}" has started in project "${projectTitle}".`;
  }

  if (notificationType === "task_finished") {
    return `Task "${taskTitle}" was completed in project "${projectTitle}".`;
  }

  return `Task "${taskTitle}" changed in project "${projectTitle}".`;
};

const notifyProjectInterns = async (projectId, notificationType, taskTitle, excludeUserId = null) => {
  try {
    const interns = await query(
      `SELECT DISTINCT s.user_id
       FROM interns i
       JOIN students s ON s.id = i.student_id
       WHERE i.project_id = $1`,
      [projectId]
    );

    const message = await buildNotificationMessage(projectId, notificationType, taskTitle);

    for (const intern of interns.rows) {
      if (excludeUserId && intern.user_id === excludeUserId) {
        continue;
      }

      await query(
        `INSERT INTO notifications (user_id, type, message, is_read)
         VALUES ($1, $2, $3, false)`,
        [intern.user_id, notificationType, message]
      );
    }
  } catch (error) {
    console.error("Error notifying interns:", error);
  }
};

const getTaskRemarks = async (taskId) =>
  query(
    `SELECT
       tr.id,
       tr.task_id,
       tr.content,
       tr.created_at,
       tr.updated_at,
       sup.full_name AS author_name,
       u.email,
       'Supervisor' AS user_role
     FROM task_remarks tr
     JOIN supervisors sup ON sup.id = tr.supervisor_id
     JOIN users u ON u.id = sup.user_id
     WHERE tr.task_id = $1
     ORDER BY tr.created_at DESC`,
    [taskId]
  );

export const createTask = async (req, res, next) => {
  try {
    const { projectId, title, description, deadline } = req.body;

    const supervisorId = await getSupervisorId(req.user.id);
    if (!supervisorId) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const project = await query(
      "SELECT id FROM projects WHERE id = $1 AND supervisor_id = $2",
      [projectId, supervisorId]
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
    await notifyProjectInterns(projectId, "task_created", title);

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const listTasks = async (req, res, next) => {
  try {
    const where = [];
    const values = [];

    if (req.user.role === "supervisor") {
      const supervisorId = await getSupervisorId(req.user.id);
      if (!supervisorId) {
        return res.status(404).json({ message: "Supervisor profile not found" });
      }

      values.push(supervisorId);
      where.push(`p.supervisor_id = $${values.length}`);
    } else if (req.user.role === "student") {
      const studentId = await getStudentId(req.user.id);
      if (!studentId) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      values.push(studentId);
      where.push(`i.student_id = $${values.length}`);
    }

    if (req.query.status) {
      values.push(req.query.status);
      where.push(`t.status = $${values.length}`);
    }

    if (req.query.projectId) {
      values.push(req.query.projectId);
      where.push(`p.id = $${values.length}`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const result = await query(
      `SELECT
         t.id,
         t.project_id,
         t.title,
         t.description,
         t.deadline,
         t.status,
         t.created_at,
         t.updated_at,
         p.title AS project_title,
         COUNT(DISTINCT tr.id)::int AS remark_count
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN interns i ON i.project_id = p.id
       LEFT JOIN task_remarks tr ON tr.task_id = t.id
       ${whereClause}
       GROUP BY t.id, p.title
       ORDER BY t.deadline ASC NULLS LAST, t.created_at DESC`,
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
         t.id,
         t.project_id,
         t.title,
         t.description,
         t.deadline,
         t.status,
         t.created_at,
         t.updated_at,
         p.title AS project_title,
         COUNT(DISTINCT tr.id)::int AS remark_count
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN task_remarks tr ON tr.task_id = t.id
       WHERE t.id = $1
       GROUP BY t.id, p.title`,
      [req.params.id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const remarks = await getTaskRemarks(req.params.id);

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
    const supervisorId = await getSupervisorId(req.user.id);
    if (!supervisorId) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const task = await query(
      `SELECT t.*
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [req.params.id, supervisorId]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
      return res.status(400).json({
        message: "Status cannot be modified here. Use transition endpoints instead."
      });
    }

    const contentChanged = req.body.description !== undefined || req.body.deadline !== undefined;

    const result = await query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           deadline = COALESCE($3, deadline),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [req.body.title ?? null, req.body.description ?? null, req.body.deadline ?? null, req.params.id]
    );

    await logAudit(req.user.id, "TASK_UPDATED", { taskId: req.params.id });

    if (contentChanged) {
      await notifyProjectInterns(task.rows[0].project_id, "task_updated", result.rows[0].title);
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const startTask = async (req, res, next) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const task = await query(
      `SELECT t.*
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN interns i ON i.project_id = p.id
       WHERE t.id = $1 AND i.student_id = $2`,
      [req.params.id, studentId]
    );

    if (task.rows.length === 0) {
      return res.status(403).json({ message: "Task not found or not assigned to you" });
    }

    if (task.rows[0].status !== "todo") {
      return res.status(400).json({ message: `Task cannot be started from status '${task.rows[0].status}'.` });
    }

    const result = await query(
      `UPDATE tasks
       SET status = 'in_progress', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    await logAudit(req.user.id, "TASK_STARTED", { taskId: req.params.id });
    await notifyProjectInterns(task.rows[0].project_id, "task_started", task.rows[0].title, req.user.id);

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const finishTask = async (req, res, next) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const task = await query(
      `SELECT t.*
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN interns i ON i.project_id = p.id
       WHERE t.id = $1 AND i.student_id = $2`,
      [req.params.id, studentId]
    );

    if (task.rows.length === 0) {
      return res.status(403).json({ message: "Task not found or not assigned to you" });
    }

    if (task.rows[0].status !== "in_progress") {
      return res.status(400).json({ message: `Task cannot be finished from status '${task.rows[0].status}'.` });
    }

    const result = await query(
      `UPDATE tasks
       SET status = 'done', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    await logAudit(req.user.id, "TASK_FINISHED", { taskId: req.params.id });
    await notifyProjectInterns(task.rows[0].project_id, "task_finished", task.rows[0].title, req.user.id);

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    if (req.user.role === "supervisor") {
      const supervisorId = await getSupervisorId(req.user.id);
      if (!supervisorId) {
        return res.status(404).json({ message: "Supervisor profile not found" });
      }

      const task = await query(
        `SELECT t.*
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE t.id = $1 AND p.supervisor_id = $2`,
        [req.params.id, supervisorId]
      );

      if (task.rows.length === 0) {
        return res.status(403).json({ message: "Task not found or not assigned to you" });
      }
    } else if (req.user.role === "student") {
      const studentId = await getStudentId(req.user.id);
      if (!studentId) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const task = await query(
        `SELECT t.*
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN interns i ON i.project_id = p.id
         WHERE t.id = $1 AND i.student_id = $2`,
        [req.params.id, studentId]
      );

      if (task.rows.length === 0) {
        return res.status(403).json({ message: "Task not found or not assigned to you" });
      }
    }

    const result = await query(
      `UPDATE tasks
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.body.status, req.params.id]
    );

    await logAudit(req.user.id, "TASK_STATUS_UPDATED", { taskId: req.params.id, status: req.body.status });
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const supervisorId = await getSupervisorId(req.user.id);
    if (!supervisorId) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const task = await query(
      `SELECT t.*
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.supervisor_id = $2`,
      [req.params.id, supervisorId]
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

export const addRemark = async (req, res, next) => {
  try {
    if (req.user.role !== "supervisor") {
      return res.status(403).json({ message: "Only supervisors can add remarks" });
    }

    const hasAccess = await hasTaskAccess(req.params.taskId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: "You don't have access to this task" });
    }

    const supervisorId = await getSupervisorId(req.user.id);
    if (!supervisorId) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `INSERT INTO task_remarks (task_id, supervisor_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.taskId, supervisorId, req.body.content]
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

    const result = await getTaskRemarks(req.params.taskId);
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const deleteRemark = async (req, res, next) => {
  try {
    if (req.user.role !== "supervisor") {
      return res.status(403).json({ message: "Only supervisors can delete remarks" });
    }

    const remark = await query("SELECT * FROM task_remarks WHERE id = $1", [req.params.remarkId]);
    if (remark.rows.length === 0) {
      return res.status(404).json({ message: "Remark not found" });
    }

    const hasAccess = await hasTaskAccess(remark.rows[0].task_id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: "You cannot delete remarks outside your assigned tasks" });
    }

    const supervisorId = await getSupervisorId(req.user.id);
    if (!supervisorId) {
      return res.status(403).json({ message: "Supervisor profile not found" });
    }

    if (remark.rows[0].supervisor_id !== supervisorId) {
      const ownership = await query(
        `SELECT tr.id
         FROM task_remarks tr
         JOIN tasks t ON t.id = tr.task_id
         JOIN projects p ON p.id = t.project_id
         WHERE tr.id = $1 AND p.supervisor_id = $2`,
        [req.params.remarkId, supervisorId]
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
