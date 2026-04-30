import { query } from "../config/db.js";

export const listReports = async (req, res, next) => {
  try {
    let sql = `SELECT r.id, r.task_id, r.intern_id, r.week_start, r.week_end, r.content, r.status,
                      r.feedback, r.validated_by_supervisor_id, r.created_at,
                      iu.name AS intern_name, su.name AS supervisor_name
               FROM reports r
               JOIN interns i ON i.id = r.intern_id
               JOIN users iu ON iu.id = i.user_id
               LEFT JOIN supervisors s ON s.id = r.validated_by_supervisor_id
               LEFT JOIN users su ON su.id = s.user_id`;
    let params = [];

    if (req.user.role === "intern") {
      sql += " WHERE i.user_id = $1";
      params = [req.user.id];
    } else if (req.user.role === "supervisor") {
      const supervisorResult = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisorResult.rows.length === 0) {
        return res.json([]);
      }
      sql += " WHERE i.supervisor_id = $1";
      params = [supervisorResult.rows[0].id];
    }

    sql += " ORDER BY r.id DESC";

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    if (req.user.role !== "intern") {
      return res.status(403).json({ message: "Only interns can submit reports" });
    }

    const { taskId, weekStart, weekEnd, content } = req.body;

    const internResult = await query("SELECT id FROM interns WHERE user_id = $1", [req.user.id]);
    if (internResult.rows.length === 0) {
      return res.status(404).json({ message: "Intern profile not found" });
    }

    const result = await query(
      `INSERT INTO reports (task_id, intern_id, week_start, week_end, content, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [taskId || null, internResult.rows[0].id, weekStart, weekEnd, content]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const validateReport = async (req, res, next) => {
  try {
    if (req.user.role === "intern") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const reportId = Number(req.params.id);
    const { status, feedback } = req.body;

    let supervisorId = null;
    if (req.user.role === "supervisor") {
      const supervisorResult = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisorResult.rows.length === 0) {
        return res.status(404).json({ message: "Supervisor profile not found" });
      }
      supervisorId = supervisorResult.rows[0].id;

      const accessResult = await query(
        `SELECT r.id
         FROM reports r
         JOIN interns i ON i.id = r.intern_id
         WHERE r.id = $1 AND i.supervisor_id = $2`,
        [reportId, supervisorId]
      );
      if (accessResult.rows.length === 0) {
        return res.status(403).json({ message: "You can only validate reports for your interns" });
      }
    }

    const result = await query(
      `UPDATE reports
       SET status = $1,
           feedback = $2,
           validated_by_supervisor_id = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, feedback || null, supervisorId, reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};
