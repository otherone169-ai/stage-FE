import { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const getStudentProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, u.email, u.created_at as user_created_at,
              sup.full_name as supervisor_name, sup.email as supervisor_email,
              c.name as company_name
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN supervisors sup ON sup.id = s.created_by_supervisor_id
       LEFT JOIN users sup_user ON sup_user.id = sup.user_id
       LEFT JOIN companies c ON c.id = sup.company_id
       WHERE s.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateStudentProfile = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const { fullName, phone, education, skills, experience, preferences } = req.body;

    const result = await query(
      `UPDATE students
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           education = COALESCE($3, education),
           skills = COALESCE($4, skills),
           experience = COALESCE($5, experience),
           preferences = COALESCE($6, preferences),
           profile_completed = true,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        fullName ?? null,
        phone ?? null,
        education ?? null,
        skills ?? null,
        experience ?? null,
        preferences ? JSON.stringify(preferences) : null,
        student.rows[0].id
      ]
    );

    await logAudit(req.user.id, "STUDENT_PROFILE_UPDATED", {
      studentId: student.rows[0].id
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const getMyInternships = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const result = await query(
      `SELECT i.*, a.status as application_status, a.applied_at, a.cover_letter,
              c.name as company_name, s.full_name as supervisor_name
       FROM internships i
       LEFT JOIN applications a ON a.internship_id = i.id AND a.student_id = $1
       LEFT JOIN companies c ON c.id = i.company_id
       LEFT JOIN supervisors s ON s.id = i.supervisor_id
       WHERE i.is_active = true 
       AND i.moderation_status = 'approved'
       ORDER BY i.created_at DESC`,
      [student.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const result = await query(
      `SELECT a.*, i.title as internship_title, i.description as internship_description,
              i.location, i.domain, i.duration_weeks,
              c.name as company_name, s.full_name as supervisor_name
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       JOIN supervisors s ON s.id = i.supervisor_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [student.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const withdrawApplication = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const result = await query(
      `UPDATE applications 
       SET status = 'withdrawn', updated_at = NOW()
       WHERE id = $1 AND student_id = $2
       RETURNING *`,
      [req.params.id, student.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    await logAudit(req.user.id, "APPLICATION_WITHDRAWN", {
      applicationId: req.params.id
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const getMyTasks = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const result = await query(
      `SELECT t.*, p.title as project_title, p.description as project_description,
              i.status as internship_status, i.start_date, i.end_date,
              tu.progress as task_progress, tu.status as update_status,
              tu.file_url as update_file_url, tu.updated_at as last_update_at
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN interns i ON i.project_id = p.id
       LEFT JOIN task_updates tu ON tu.task_id = t.id AND tu.intern_id = i.id
       WHERE i.student_id = $1 AND i.status = 'active'
       ORDER BY t.deadline ASC, t.created_at ASC`,
      [student.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const updateTaskProgress = async (req, res, next) => {
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

    await logAudit(req.user.id, "TASK_PROGRESS_UPDATED", {
      taskId: taskId,
      internId: taskCheck.rows[0].intern_id
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const getMyReports = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const result = await query(
      `SELECT r.*, p.title as project_title, p.description as project_description
       FROM reports r
       JOIN interns i ON i.id = r.intern_id
       JOIN projects p ON p.id = r.project_id
       WHERE i.student_id = $1
       ORDER BY r.created_at DESC`,
      [student.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const { title, content } = req.body;

    // Get student's active project
    const internInfo = await query(
      `SELECT i.id as intern_id, i.project_id
       FROM interns i
       WHERE i.student_id = $1 AND i.status = 'active'
       LIMIT 1`,
      [student.rows[0].id]
    );

    if (internInfo.rows.length === 0) {
      return res.status(404).json({ message: "No active project found" });
    }

    const result = await query(
      `INSERT INTO reports (intern_id, project_id, title, content, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [internInfo.rows[0].intern_id, internInfo.rows[0].project_id, title, content]
    );

    await logAudit(req.user.id, "REPORT_CREATED", {
      reportId: result.rows[0].id,
      projectId: internInfo.rows[0].project_id
    });

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const { title, content, status } = req.body;
    const reportId = req.params.id;

    // Verify report belongs to student
    const reportCheck = await query(
      `SELECT r.id
       FROM reports r
       JOIN interns i ON i.id = r.intern_id
       WHERE r.id = $1 AND i.student_id = $2`,
      [reportId, student.rows[0].id]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({ message: "Report not found or not authorized" });
    }

    const result = await query(
      `UPDATE reports
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title ?? null, content ?? null, status ?? null, reportId]
    );

    await logAudit(req.user.id, "REPORT_UPDATED", {
      reportId: reportId
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const submitReport = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const reportId = req.params.id;

    // Verify report belongs to student and is in draft status
    const reportCheck = await query(
      `SELECT r.id
       FROM reports r
       JOIN interns i ON i.id = r.intern_id
       WHERE r.id = $1 AND i.student_id = $2 AND r.status = 'draft'`,
      [reportId, student.rows[0].id]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({ message: "Report not found, not authorized, or not in draft status" });
    }

    const result = await query(
      `UPDATE reports
       SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [reportId]
    );

    await logAudit(req.user.id, "REPORT_SUBMITTED", {
      reportId: reportId
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};
