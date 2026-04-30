import { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const createReport = async (req, res, next) => {
  try {
    const { internId, title, content } = req.body;

    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Verify intern belongs to student
    const intern = await query("SELECT id, student_id, supervisor_id FROM interns WHERE id = $1 AND student_id = $2", [
      internId,
      student.rows[0].id
    ]);

    if (intern.rows.length === 0) {
      return res.status(403).json({ message: "Intern not found or not assigned to you" });
    }

    const result = await query(
      `INSERT INTO reports (intern_id, student_id, supervisor_id, title, content, status)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING *`,
      [internId, student.rows[0].id, intern.rows[0].supervisor_id || null, title, content]
    );

    await logAudit(req.user.id, "REPORT_CREATED", { reportId: result.rows[0].id });

    return res.status(201).json(result.rows[0]);
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

    const report = await query("SELECT * FROM reports WHERE id = $1 AND student_id = $2", [req.params.id, student.rows[0].id]);

    if (report.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.rows[0].status !== "draft") {
      return res.status(400).json({ message: "Only draft reports can be submitted" });
    }

    const result = await query(
      `UPDATE reports
       SET status = 'submitted', submitted_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    await logAudit(req.user.id, "REPORT_SUBMITTED", { reportId: req.params.id });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const listMyReports = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const result = await query(
      `SELECT 
        r.id, r.title, r.status, r.feedback, r.created_at, r.submitted_at, r.validated_at,
        i.id as intern_id, i.status as intern_status,
        int.title as internship_title,
        c.name as company_name
      FROM reports r
      JOIN interns i ON i.id = r.intern_id
      JOIN projects p ON p.id = i.project_id
      JOIN internships int ON int.id = p.internship_id
      JOIN companies c ON c.id = int.company_id
      WHERE r.student_id = $1
      ORDER BY r.created_at DESC`,
      [student.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getReportDetails = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);

    let query_str;
    let params;

    if (student.rows.length > 0) {
      query_str = "SELECT * FROM reports WHERE id = $1 AND student_id = $2";
      params = [req.params.id, student.rows[0].id];
    } else {
      const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisor.rows.length === 0) {
        return res.status(404).json({ message: "Access denied" });
      }
      query_str = "SELECT * FROM reports WHERE id = $1 AND supervisor_id = $2";
      params = [req.params.id, supervisor.rows[0].id];
    }

    const result = await query(query_str, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json(result.rows[0]);
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

    const report = await query("SELECT * FROM reports WHERE id = $1 AND student_id = $2", [req.params.id, student.rows[0].id]);

    if (report.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.rows[0].status !== "draft") {
      return res.status(400).json({ message: "Only draft reports can be edited" });
    }

    const result = await query(
      `UPDATE reports
       SET title = COALESCE($1, title),
           content = COALESCE($2, content)
       WHERE id = $3
       RETURNING *`,
      [req.body.title ?? null, req.body.content ?? null, req.params.id]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

// Supervisor validates report
export const validateReport = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const report = await query("SELECT * FROM reports WHERE id = $1 AND supervisor_id = $2", [req.params.id, supervisor.rows[0].id]);

    if (report.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.rows[0].status !== "submitted") {
      return res.status(400).json({ message: "Only submitted reports can be validated" });
    }

    const result = await query(
      `UPDATE reports
       SET status = $1, validated_at = NOW(), feedback = $2
       WHERE id = $3
       RETURNING *`,
      [req.body.status, req.body.feedback || null, req.params.id]
    );

    await logAudit(req.user.id, "REPORT_VALIDATED", {
      reportId: req.params.id,
      status: req.body.status
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const listReportsForValidation = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `SELECT 
        r.id, r.title, r.status, r.feedback, r.created_at, r.submitted_at, r.validated_at,
        i.id as intern_id,
        s.full_name as student_name,
        int.title as internship_title
      FROM reports r
      JOIN interns i ON i.id = r.intern_id
      JOIN students s ON s.id = r.student_id
      JOIN projects p ON p.id = i.project_id
      JOIN internships int ON int.id = p.internship_id
      WHERE r.supervisor_id = $1 AND r.status = 'submitted'
      ORDER BY r.submitted_at DESC`,
      [supervisor.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};
