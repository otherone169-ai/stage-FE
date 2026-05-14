import pool, { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

const getSupervisor = async (userId) => {
  const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [userId]);
  return supervisor.rows[0]?.id || null;
};

const normalizeTasks = (tasks) =>
  Array.isArray(tasks)
    ? tasks
        .map((task) => ({
          title: typeof task?.title === "string" ? task.title.trim() : "",
          description: typeof task?.description === "string" ? task.description.trim() : ""
        }))
        .filter((task) => task.title.length > 0)
    : [];

const buildAssignmentNotification = (projectTitle, projectDescription, tasks) => {
  const lines = [
    `You have been assigned to the project: ${projectTitle}`,
    projectDescription ? `Description: ${projectDescription}` : null,
    tasks.length > 0 ? "Tasks:" : null,
    tasks.length > 0 ? tasks.map((task, index) => `${index + 1}. ${task.title}`).join("\n") : null
  ].filter(Boolean);

  return lines.join("\n\n");
};

export const listProjects = async (req, res, next) => {
  try {
    const supervisorId = await getSupervisor(req.user.id);
    if (!supervisorId) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `SELECT
         p.*,
         COUNT(DISTINCT intern.id)::int AS interns_count,
         COUNT(DISTINCT CASE WHEN intern.status = 'active' THEN intern.id END)::int AS active_intern_count,
         COUNT(DISTINCT t.id)::int AS task_count,
         COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int AS completed_task_count
       FROM projects p
       LEFT JOIN interns intern ON intern.project_id = p.id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.supervisor_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [supervisorId]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const createProject = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { title, description, objectives, location, duration, domain, requirements, tasks = [] } = req.body;

    const supervisorId = await getSupervisor(req.user.id);
    if (!supervisorId) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const normalizedTasks = normalizeTasks(tasks);

    await client.query("BEGIN");

    const projectResult = await client.query(
      `INSERT INTO projects
         (supervisor_id, title, description, objectives, location, duration, domain, requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        supervisorId,
        title.trim(),
        description?.trim() || null,
        objectives?.trim() || description?.trim() || null,
        location?.trim() || null,
        duration?.trim() || null,
        domain?.trim() || null,
        requirements?.trim() || null
      ]
    );

    const project = projectResult.rows[0];
    const createdTasks = [];

    for (const task of normalizedTasks) {
      const taskResult = await client.query(
        `INSERT INTO tasks (project_id, title, description, status)
         VALUES ($1, $2, $3, 'todo')
         RETURNING id, title, description, status, created_at`,
        [project.id, task.title, task.description || null]
      );

      createdTasks.push(taskResult.rows[0]);
    }

    await client.query("COMMIT");

    await logAudit(req.user.id, "PROJECT_CREATED", { projectId: project.id });

    return res.status(201).json({
      ...project,
      tasks: createdTasks
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

export const assignInternToProject = async (req, res, next) => {
  try {
    const { projectId, studentId } = req.body;
    if (!projectId || !studentId) {
      return res.status(400).json({ message: "projectId and studentId are required" });
    }

    const supervisorId = await getSupervisor(req.user.id);
    if (!supervisorId) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const project = await query(
      `SELECT id, title, description
       FROM projects
       WHERE id = $1 AND supervisor_id = $2`,
      [projectId, supervisorId]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const student = await query(
      `SELECT s.id, s.user_id, u.email
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.created_by_supervisor_id = $2`,
      [studentId, supervisorId]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found or not created by you — only pending stagiaires you created can be assigned"
      });
    }

    const pendingCheck = await query(
      `SELECT 1 FROM interns i
       WHERE i.student_id = $1 AND i.status IN ('active', 'paused')
       LIMIT 1`,
      [studentId]
    );

    if (pendingCheck.rows.length > 0) {
      return res.status(409).json({
        message: "Student is not pending — they already have an active or paused assignment"
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existingProject = await client.query(
        `SELECT id
         FROM interns
         WHERE student_id = $1 AND project_id = $2`,
        [studentId, projectId]
      );

      if (existingProject.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "Student already assigned to this project" });
      }

      const assignmentResult = await client.query(
        `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date)
         VALUES ($1, $2, $3, 'active', CURRENT_DATE)
         RETURNING id`,
        [studentId, projectId, supervisorId]
      );

      const tasks = await client.query(
        `SELECT id, title
         FROM tasks
         WHERE project_id = $1
         ORDER BY created_at`,
        [projectId]
      );

      const notificationResult = await client.query(
        `INSERT INTO notifications (user_id, type, message, is_read)
         VALUES ($1, 'project_assignment', $2, false)
         RETURNING id`,
        [
          student.rows[0].user_id,
          buildAssignmentNotification(project.rows[0].title, project.rows[0].description, tasks.rows)
        ]
      );

      await client.query("COMMIT");

      await logAudit(req.user.id, "STUDENT_ASSIGNED_TO_PROJECT", {
        projectId,
        studentId,
        assignmentId: assignmentResult.rows[0].id
      });

      return res.status(201).json({
        success: true,
        message: "Student assigned to project successfully",
        assignmentId: assignmentResult.rows[0].id,
        notificationId: notificationResult.rows[0].id
      });
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
  } catch (error) {
    return next(error);
  }
};

export const assignInternsToProject = async (req, res, next) => {
  try {
    const { projectId, studentIds } = req.body;

    if (!projectId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "projectId and studentIds array are required" });
    }

    const supervisorId = await getSupervisor(req.user.id);
    if (!supervisorId) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const project = await query(
      `SELECT id, title, description
       FROM projects
       WHERE id = $1 AND supervisor_id = $2`,
      [projectId, supervisorId]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const students = await query(
      `SELECT s.id, s.user_id, u.email
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ANY($1::uuid[]) AND s.created_by_supervisor_id = $2`,
      [studentIds, supervisorId]
    );

    if (students.rows.length === 0) {
      return res.status(404).json({ message: "No valid pending stagiaires found for your account" });
    }

    const allowedIds = new Set(students.rows.map((r) => r.id));

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const tasks = await client.query(
        `SELECT id, title
         FROM tasks
         WHERE project_id = $1
         ORDER BY created_at`,
        [projectId]
      );

      const assignments = [];
      const errors = [];

      for (const studentId of studentIds) {
        if (!allowedIds.has(studentId)) {
          errors.push({ studentId, error: "Not a stagiaire you created" });
          continue;
        }

        const activeOther = await client.query(
          `SELECT 1 FROM interns i
           WHERE i.student_id = $1 AND i.status IN ('active', 'paused')
           LIMIT 1`,
          [studentId]
        );

        if (activeOther.rows.length > 0) {
          errors.push({ studentId, error: "Student already has an active or paused assignment" });
          continue;
        }

        const alreadyAssigned = await client.query(
          `SELECT id
           FROM interns
           WHERE student_id = $1 AND project_id = $2`,
          [studentId, projectId]
        );

        if (alreadyAssigned.rows.length > 0) {
          errors.push({ studentId, error: "Already assigned to this project" });
          continue;
        }

        const assignment = await client.query(
          `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date)
           VALUES ($1, $2, $3, 'active', CURRENT_DATE)
           RETURNING id`,
          [studentId, projectId, supervisorId]
        );

        const student = students.rows.find((row) => row.id === studentId);
        if (student) {
          await client.query(
            `INSERT INTO notifications (user_id, type, message, is_read)
             VALUES ($1, 'project_assignment', $2, false)`,
            [student.user_id, buildAssignmentNotification(project.rows[0].title, project.rows[0].description, tasks.rows)]
          );
        }

        assignments.push({
          studentId,
          assignmentId: assignment.rows[0].id
        });
      }

      await client.query("COMMIT");

      await logAudit(req.user.id, "STUDENTS_ASSIGNED_TO_PROJECT", {
        projectId,
        assignedCount: assignments.length,
        errorsCount: errors.length
      });

      return res.status(201).json({
        success: true,
        message: `${assignments.length} students assigned successfully`,
        assignments,
        errors,
        summary: {
          totalRequested: studentIds.length,
          successfullyAssigned: assignments.length,
          errors: errors.length
        }
      });
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
  } catch (error) {
    return next(error);
  }
};

export const getMyAssignedProject = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as student" });
    }

    const result = await query(
      `SELECT
         p.id,
         p.title,
         p.description,
         p.objectives,
         COUNT(DISTINCT t.id)::int AS total_tasks,
         COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END)::int AS todo_tasks,
         COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END)::int AS in_progress_tasks,
         COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int AS done_tasks
       FROM interns ir
       JOIN projects p ON p.id = ir.project_id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE ir.student_id = $1 AND ir.status = 'active'
       GROUP BY p.id
       ORDER BY ir.created_at DESC
       LIMIT 1`,
      [student.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No assigned project found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const projectId = req.params.id;
    const supervisorId = await getSupervisor(req.user.id);
    if (!supervisorId) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const project = await query("SELECT id FROM projects WHERE id = $1 AND supervisor_id = $2", [projectId, supervisorId]);

    if (project.rows.length === 0) {
      return res.status(404).json({ message: "Project not found or not authorized" });
    }

    await client.query("BEGIN");
    await client.query("DELETE FROM projects WHERE id = $1", [projectId]);
    await client.query("COMMIT");

    await logAudit(req.user.id, "PROJECT_DELETED", { projectId });
    return res.json({ message: "Project deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

export const getProjectInterns = async (req, res, next) => {
  try {
    const supervisorId = await getSupervisor(req.user.id);
    if (!supervisorId) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const projectId = req.params.id;

    const projectCheck = await query("SELECT id FROM projects WHERE id = $1 AND supervisor_id = $2", [projectId, supervisorId]);

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: "Project not found or not authorized" });
    }

    const result = await query(
      `SELECT
         intern.id AS intern_id,
         intern.status AS intern_status,
         intern.start_date,
         intern.end_date,
         st.id AS student_id,
         st.full_name,
         u.email AS student_email,
         st.education,
         st.skills,
         COUNT(DISTINCT t.id)::int AS total_tasks,
         COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int AS completed_tasks,
         COUNT(DISTINCT tu.id)::int AS task_updates_count
       FROM interns intern
       JOIN students st ON st.id = intern.student_id
       JOIN users u ON u.id = st.user_id
       LEFT JOIN tasks t ON t.project_id = $1
       LEFT JOIN task_updates tu ON tu.task_id = t.id AND tu.intern_id = intern.id
       WHERE intern.project_id = $1
       GROUP BY intern.id, st.id, u.email, st.full_name, st.education, st.skills
       ORDER BY intern.created_at DESC`,
      [projectId]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};
