import { query } from "../../config/db.js";

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
