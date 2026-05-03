import pool, { query } from "../../config/db.js";

export const listProjects = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const where = [];
    const values = [supervisor.rows[0].id];

    if (req.query.internshipId) {
      values.push(req.query.internshipId);
      where.push(`p.internship_id = $${values.length}`);
    }

    const whereClause = where.length > 0 ? `AND ${where.join(" AND ")}` : "";

    const result = await query(
      `SELECT
        p.*,
        i.title as internship_title,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_task_count,
        COUNT(DISTINCT ir.id) as interns_count
      FROM projects p
      JOIN internships i ON i.id = p.internship_id
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN interns ir ON ir.project_id = p.id
      WHERE p.supervisor_id = $1 ${whereClause}
      GROUP BY p.id, p.internship_id, p.supervisor_id, p.title, p.description, p.objectives, p.created_at, i.title
      ORDER BY p.created_at DESC`,
      values
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { internshipId, title, description, objectives, tasks = [] } = req.body;

    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const internship = await query(
      "SELECT id FROM internships WHERE id = $1 AND supervisor_id = $2",
      [internshipId, supervisor.rows[0].id]
    );

    if (internship.rows.length === 0) {
      return res.status(404).json({ message: "Internship not found" });
    }

    const normalizedTasks = Array.isArray(tasks)
      ? tasks
          .map((task) => ({
            title: typeof task?.title === "string" ? task.title.trim() : "",
            description: typeof task?.description === "string" ? task.description.trim() : ""
          }))
          .filter((task) => task.title.length > 0)
      : [];

    if (normalizedTasks.length === 0) {
      return res.status(400).json({ message: "At least one task is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const projectResult = await client.query(
        `INSERT INTO projects (internship_id, supervisor_id, title, description, objectives)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          internshipId,
          supervisor.rows[0].id,
          title.trim(),
          description?.trim() || null,
          objectives?.trim() || description?.trim() || null
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

      return res.status(201).json({
        ...project,
        tasks: createdTasks
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return next(error);
  }
};

// Assign a student/intern to a project (supervisor only)
export const assignInternToProject = async (req, res, next) => {
  try {
    const { projectId, studentId } = req.body;

    if (!projectId || !studentId) {
      return res.status(400).json({ message: "projectId and studentId are required" });
    }

    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Verify project belongs to supervisor
    const project = await query(
      `SELECT p.id, p.title, p.description, i.title as internship_title
       FROM projects p
       JOIN internships i ON i.id = p.internship_id
       WHERE p.id = $1 AND p.supervisor_id = $2`,
      [projectId, supervisor.rows[0].id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get student and user info
    const student = await query(
      `SELECT s.id, u.id as user_id, u.email
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [studentId]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if already assigned
      const existing = await client.query(
        `SELECT id FROM interns WHERE student_id = $1 AND project_id = $2`,
        [studentId, projectId]
      );

      if (existing.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "Student already assigned to this project" });
      }

      // Create assignment in interns table
      const assignmentResult = await client.query(
        `INSERT INTO interns (student_id, project_id, supervisor_id, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id`,
        [studentId, projectId, supervisor.rows[0].id]
      );

      // Get all tasks for the project to include in notification
      const tasks = await client.query(
        `SELECT id, title, description, status FROM tasks WHERE project_id = $1 ORDER BY created_at`,
        [projectId]
      );

      // Create notification for student
      const projectInfo = project.rows[0];
      const tasksList = tasks.rows
        .map((t, i) => `${i + 1}. ${t.title}${t.description ? ` - ${t.description}` : ""}`)
        .join("\n");

      const notificationMessage = `Vous avez été assigné au projet: "${projectInfo.title}" (${projectInfo.internship_title})\n\nDescription: ${projectInfo.description || "N/A"}\n\nTâches à accomplir:\n${tasksList}`;

      const notificationResult = await client.query(
        `INSERT INTO notifications (user_id, type, message, link_url, is_read)
         VALUES ($1, 'project_assignment', $2, $3, false)
         RETURNING id, message, link_url`,
        [student.rows[0].user_id, notificationMessage, `/app/student/my-project`]
      );

      // Log audit
      const auditMetadata = {
        projectId,
        projectTitle: projectInfo.title,
        studentId,
        studentEmail: student.rows[0].email,
        taskCount: tasks.rows.length
      };

      await client.query(
        `INSERT INTO audit_logs (user_id, action, metadata)
         VALUES ($1, $2, $3)`,
        [req.user.id, "student_assigned_to_project", JSON.stringify(auditMetadata)]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Student assigned to project successfully",
        assignmentId: assignmentResult.rows[0].id,
        notificationId: notificationResult.rows[0].id
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return next(error);
  }
};

// Get the project assigned to the current student
export const getMyAssignedProject = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as student" });
    }

    const result = await query(
      `SELECT 
        p.id, p.title, p.description, p.objectives,
        i.title as internship_title,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) as todo_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as done_tasks
      FROM interns ir
      JOIN projects p ON p.id = ir.project_id
      JOIN internships i ON i.id = p.internship_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE ir.student_id = $1 AND ir.status = 'active'
      GROUP BY p.id, i.title
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
