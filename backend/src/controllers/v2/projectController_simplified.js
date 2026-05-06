import pool, { query } from "../../config/db.js";

export const listProjects = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `SELECT 
        p.*,
        i.title as internship_title,
        s.company_name,
        COUNT(DISTINCT intern.id) as intern_count,
        COUNT(DISTINCT CASE WHEN intern.status = 'active' THEN intern.id END) as active_intern_count,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_task_count
      FROM projects p
      LEFT JOIN internships i ON i.id = p.internship_id
      LEFT JOIN supervisors s ON s.id = p.supervisor_id
      LEFT JOIN interns intern ON intern.project_id = p.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.supervisor_id = $1
      GROUP BY p.id, i.title, s.company_name
      ORDER BY p.created_at DESC`,
      [supervisor.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { title, description, objectives, location, duration, domain, requirements, internshipId, tasks = [] } = req.body;

    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    // Validate internship belongs to supervisor if provided
    if (internshipId) {
      const internship = await query(
        "SELECT id FROM internships WHERE id = $1 AND supervisor_id = $2",
        [internshipId, supervisor.rows[0].id]
      );
      if (internship.rows.length === 0) {
        return res.status(404).json({ message: "Internship not found or not authorized" });
      }
    }

    const normalizedTasks = Array.isArray(tasks)
      ? tasks
          .map((task) => ({
            title: typeof task?.title === "string" ? task.title.trim() : "",
            description: typeof task?.description === "string" ? task.description.trim() : ""
          }))
          .filter((task) => task.title.length > 0)
      : [];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const projectResult = await client.query(
        `INSERT INTO projects (internship_id, supervisor_id, title, description, objectives, location, duration, domain, requirements)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          internshipId || null,
          supervisor.rows[0].id,
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

// Assign multiple students to a project (Multi-interns per project)
export const assignInternsToProject = async (req, res, next) => {
  try {
    const { projectId, studentIds } = req.body;

    if (!projectId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "projectId and studentIds array are required" });
    }

    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Verify project belongs to supervisor
    const project = await query(
      `SELECT p.id, p.title, p.description
       FROM projects p
       WHERE p.id = $1 AND p.supervisor_id = $2`,
      [projectId, supervisor.rows[0].id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get all students info
    const students = await query(
      `SELECT s.id, u.id as user_id, u.email
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ANY($1)`,
      [studentIds]
    );

    if (students.rows.length === 0) {
      return res.status(404).json({ message: "No valid students found" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const assignments = [];
      const errors = [];

      for (const studentId of studentIds) {
        try {
          // Check if already assigned to this project
          const existingProject = await client.query(
            `SELECT id FROM interns WHERE student_id = $1 AND project_id = $2`,
            [studentId, projectId]
          );

          if (existingProject.rows.length > 0) {
            errors.push({ studentId, error: "Already assigned to this project" });
            continue;
          }

          // Check if student is already assigned to any other active project
          const existingAssignment = await client.query(
            `SELECT i.id, p.title as project_title 
             FROM interns i
             JOIN projects p ON p.id = i.project_id
             WHERE i.student_id = $1 AND i.status IN ('active', 'paused')`,
            [studentId]
          );

          if (existingAssignment.rows.length > 0) {
            errors.push({ 
              studentId, 
              error: "Already assigned to another project",
              details: existingAssignment.rows[0]
            });
            continue;
          }

          // Create assignment in interns table
          const assignmentResult = await client.query(
            `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date, end_date)
             VALUES ($1, $2, $3, 'active', CURRENT_DATE, NULL)
             RETURNING id`,
            [studentId, projectId, supervisor.rows[0].id]
          );

          assignments.push({
            studentId,
            assignmentId: assignmentResult.rows[0].id
          });

        } catch (error) {
          errors.push({ studentId, error: error.message });
        }
      }

      // Create notifications for successfully assigned students
      const projectInfo = project.rows[0];
      const tasks = await client.query(
        `SELECT id, title, description FROM tasks WHERE project_id = $1 ORDER BY created_at`,
        [projectId]
      );

      for (const assignment of assignments) {
        const student = students.rows.find(s => s.id === assignment.studentId);
        if (student) {
          const tasksList = tasks.rows
            .map((t, i) => `${i + 1}. ${t.title}${t.description ? ` - ${t.description}` : ""}`)
            .join("\n");

          const notificationMessage = `Vous avez été assigné au projet: "${projectInfo.title}"

Description: ${projectInfo.description || "N/A"}

Tâches à accomplir:
${tasksList}`;

          await client.query(
            `INSERT INTO notifications (user_id, type, message, is_read)
             VALUES ($1, 'project_assignment', $2, false)`,
            [student.user_id, notificationMessage]
          );
        }
      }

      // Log audit
      await client.query(
        `INSERT INTO audit_logs (user_id, action, metadata)
         VALUES ($1, $2, $3)`,
        [req.user.id, "students_assigned_to_project", JSON.stringify({
          projectId,
          projectTitle: projectInfo.title,
          assignedCount: assignments.length,
          errorsCount: errors.length
        })]
      );

      await client.query("COMMIT");

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
        s.company_name,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) as todo_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as done_tasks,
        COUNT(DISTINCT intern.id) as total_interns,
        COUNT(DISTINCT CASE WHEN intern.status = 'active' THEN intern.id END) as active_interns
      FROM interns ir
      JOIN projects p ON p.id = ir.project_id
      LEFT JOIN internships i ON i.id = p.internship_id
      LEFT JOIN supervisors s ON s.id = p.supervisor_id
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN interns intern ON intern.project_id = p.id
      WHERE ir.student_id = $1 AND ir.status = 'active'
      GROUP BY p.id, i.title, s.company_name
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

// Get all interns assigned to a project (Multi-interns per project)
export const getProjectInterns = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const projectId = req.params.id;

    // Verify project belongs to supervisor
    const projectCheck = await query(
      "SELECT id FROM projects WHERE id = $1 AND supervisor_id = $2",
      [projectId, supervisor.rows[0].id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: "Project not found or not authorized" });
    }

    const result = await query(
      `SELECT 
        intern.id as intern_id,
        intern.status as intern_status,
        intern.start_date,
        intern.end_date,
        st.id as student_id,
        st.full_name,
        u.email as student_email,
        st.education,
        st.skills,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT tu.id) as task_updates_count
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

export const deleteProject = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    // Check if project has active interns
    const activeInterns = await query(
      `SELECT COUNT(*) as count 
       FROM interns 
       WHERE project_id = $1 AND status IN ('active', 'paused')`,
      [req.params.id]
    );

    if (parseInt(activeInterns.rows[0].count) > 0) {
      return res.status(409).json({ 
        message: "Cannot delete project with active interns" 
      });
    }

    const result = await query(
      "DELETE FROM projects WHERE id = $1 AND supervisor_id = $2 RETURNING id, title",
      [req.params.id, supervisor.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json({
      message: "Project deleted successfully",
      project: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
};
