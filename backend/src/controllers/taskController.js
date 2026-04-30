import { query } from "../config/db.js";

const canAccessTask = async (taskId, user) => {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "intern") {
    const result = await query(
      `SELECT t.id
       FROM tasks t
       JOIN interns i ON i.id = t.intern_id
       WHERE t.id = $1 AND i.user_id = $2`,
      [taskId, user.id]
    );
    return result.rows.length > 0;
  }

  const supervisorResult = await query("SELECT id FROM supervisors WHERE user_id = $1", [user.id]);
  if (supervisorResult.rows.length === 0) {
    return false;
  }

  const result = await query(
    `SELECT t.id
     FROM tasks t
     JOIN interns i ON i.id = t.intern_id
     WHERE t.id = $1 AND i.supervisor_id = $2`,
    [taskId, supervisorResult.rows[0].id]
  );
  return result.rows.length > 0;
};

export const listTasks = async (req, res, next) => {
  try {
    let sql = `SELECT t.id, t.title, t.description, t.status, t.due_date, t.created_at,
                      i.id AS intern_id, iu.name AS intern_name,
                      su.name AS supervisor_name
               FROM tasks t
               JOIN interns i ON i.id = t.intern_id
               JOIN users iu ON iu.id = i.user_id
               LEFT JOIN supervisors s ON s.id = t.created_by_supervisor_id
               LEFT JOIN users su ON su.id = s.user_id`;
    let params = [];

    if (req.user.role === "intern") {
      sql += " WHERE i.user_id = $1";
      params = [req.user.id];
    } else if (req.user.role === "supervisor") {
      const supResult = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supResult.rows.length === 0) {
        return res.json([]);
      }
      sql += " WHERE i.supervisor_id = $1";
      params = [supResult.rows[0].id];
    }

    sql += " ORDER BY t.id DESC";

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, internId, dueDate } = req.body;

    const internResult = await query("SELECT id, supervisor_id FROM interns WHERE id = $1", [internId]);
    if (internResult.rows.length === 0) {
      return res.status(404).json({ message: "Intern not found" });
    }

    let createdBySupervisorId = null;

    if (req.user.role === "supervisor") {
      const supervisorResult = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisorResult.rows.length === 0) {
        return res.status(403).json({ message: "Supervisor profile not found" });
      }
      createdBySupervisorId = supervisorResult.rows[0].id;

      if (internResult.rows[0].supervisor_id !== createdBySupervisorId) {
        return res.status(403).json({ message: "You can only assign tasks to your interns" });
      }
    }

    const result = await query(
      `INSERT INTO tasks (title, description, status, due_date, intern_id, created_by_supervisor_id)
       VALUES ($1, $2, 'todo', $3, $4, $5)
       RETURNING *`,
      [title, description || null, dueDate || null, internId, createdBySupervisorId]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);

    const access = await canAccessTask(taskId, req.user);
    if (!access) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, description, internId, dueDate, status } = req.body;

    const result = await query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           intern_id = COALESCE($3, intern_id),
           due_date = COALESCE($4, due_date),
           status = COALESCE($5, status),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title || null, description || null, internId || null, dueDate || null, status || null, taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);
    const { status } = req.body;

    const access = await canAccessTask(taskId, req.user);
    if (!access) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await query(
      "UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);

    const access = await canAccessTask(taskId, req.user);
    if (!access || req.user.role === "intern") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await query("DELETE FROM tasks WHERE id = $1 RETURNING id", [taskId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
