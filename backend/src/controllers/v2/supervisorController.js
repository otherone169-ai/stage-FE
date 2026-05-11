import pool, { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

const getSupervisorByUserId = async (userId) => {
  const result = await query("SELECT * FROM supervisors WHERE user_id = $1", [userId]);
  return result.rows[0] || null;
};

export const listSupervisors = async (req, res, next) => {
  try {
    const values = [];
    const where = [];

    if (req.query.companyName) {
      values.push(`%${req.query.companyName}%`);
      where.push(`s.company_name ILIKE $${values.length}`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const result = await query(
      `SELECT
         s.id,
         s.user_id,
         s.full_name,
         s.position,
         s.company_name,
         s.company_description,
         s.company_location,
         s.company_website,
         s.created_at,
         s.updated_at,
         u.email,
         u.is_active,
         COUNT(DISTINCT i.id)::int AS interns_count,
         COUNT(DISTINCT p.id)::int AS projects_count,
         COUNT(DISTINCT t.id)::int AS tasks_count
       FROM supervisors s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN interns i ON i.supervisor_id = s.id AND i.status = 'active'
       LEFT JOIN projects p ON p.supervisor_id = s.id
       LEFT JOIN tasks t ON t.project_id = p.id
       ${whereClause}
       GROUP BY s.id, u.id
       ORDER BY s.created_at DESC`,
      values
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getSupervisorDetails = async (req, res, next) => {
  try {
    const supervisor = await query(
      `SELECT
         s.id,
         s.user_id,
         s.full_name,
         s.position,
         s.company_name,
         s.company_description,
         s.company_location,
         s.company_website,
         s.created_at,
         s.updated_at,
         u.email,
         u.is_active
       FROM supervisors s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    const interns = await query(
      `SELECT
         i.id,
         i.status,
         i.start_date,
         i.end_date,
         st.full_name AS student_name,
         p.title AS project_title,
         COUNT(DISTINCT t.id)::int AS task_count,
         COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int AS completed_task_count
       FROM interns i
       JOIN students st ON st.id = i.student_id
       JOIN projects p ON p.id = i.project_id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE i.supervisor_id = $1
       GROUP BY i.id, st.full_name, p.title
       ORDER BY i.created_at DESC`,
      [req.params.id]
    );

    return res.json({
      ...supervisor.rows[0],
      assigned_interns: interns.rows
    });
  } catch (error) {
    return next(error);
  }
};

export const updateSupervisor = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE id = $1", [req.params.id]);

    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    const result = await query(
      `UPDATE supervisors
       SET full_name = COALESCE($1, full_name),
           position = COALESCE($2, position),
           company_name = COALESCE($3, company_name),
           company_description = COALESCE($4, company_description),
           company_location = COALESCE($5, company_location),
           company_website = COALESCE($6, company_website),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        req.body.fullName ?? null,
        req.body.position ?? null,
        req.body.companyName ?? null,
        req.body.companyDescription ?? null,
        req.body.companyLocation ?? null,
        req.body.companyWebsite ?? null,
        req.params.id
      ]
    );

    await logAudit(req.user.id, "SUPERVISOR_UPDATED", { supervisorId: req.params.id });
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const deleteSupervisor = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE id = $1", [req.params.id]);

    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    await query("DELETE FROM supervisors WHERE id = $1", [req.params.id]);
    await logAudit(req.user.id, "SUPERVISOR_DELETED", { supervisorId: req.params.id });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const supervisor = await query(
      `SELECT
         s.id,
         s.full_name,
         s.position,
         s.company_name,
         s.company_description,
         s.company_location,
         s.company_website,
         s.created_at,
         s.updated_at,
         u.email
       FROM supervisors s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = $1`,
      [req.user.id]
    );

    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    return res.json(supervisor.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const supervisor = await getSupervisorByUserId(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE supervisors
       SET full_name = COALESCE($1, full_name),
           position = COALESCE($2, position),
           company_name = COALESCE($3, company_name),
           company_description = COALESCE($4, company_description),
           company_location = COALESCE($5, company_location),
           company_website = COALESCE($6, company_website),
           updated_at = NOW()
       WHERE user_id = $7`,
      [
        req.body.fullName ?? null,
        req.body.position ?? null,
        req.body.companyName ?? null,
        req.body.companyDescription ?? null,
        req.body.companyLocation ?? null,
        req.body.companyWebsite ?? null,
        req.user.id
      ]
    );

    await client.query("COMMIT");

    const updated = await query(
      `SELECT
         s.id,
         s.full_name,
         s.position,
         s.company_name,
         s.company_description,
         s.company_location,
         s.company_website,
         s.created_at,
         s.updated_at,
         u.email
       FROM supervisors s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = $1`,
      [req.user.id]
    );

    await logAudit(req.user.id, "SUPERVISOR_PROFILE_UPDATED", { supervisorId: supervisor.id });
    return res.json(updated.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

export const listMyInterns = async (req, res, next) => {
  try {
    const supervisor = await getSupervisorByUserId(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `SELECT
         i.id,
         i.status,
         i.start_date,
         i.end_date,
         st.id AS student_id,
         st.full_name,
         st.skills,
         p.id AS project_id,
         p.title AS project_title,
         COUNT(DISTINCT t.id)::int AS total_tasks,
         COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int AS completed_tasks,
         COUNT(DISTINCT f.id)::int AS feedback_count
       FROM interns i
       JOIN students st ON st.id = i.student_id
       JOIN projects p ON p.id = i.project_id
       LEFT JOIN tasks t ON t.project_id = p.id
       LEFT JOIN feedbacks f ON f.intern_id = i.id
       WHERE i.supervisor_id = $1
       GROUP BY i.id, st.id, p.id
       ORDER BY i.created_at DESC`,
      [supervisor.id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const listCompanyInternships = async (req, res, next) => {
  try {
    const supervisor = await getSupervisorByUserId(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `SELECT
         id,
         title,
         description,
         location,
         domain,
         start_date,
         end_date,
         duration_weeks,
         moderation_status,
         is_active,
         created_at
       FROM internships
       WHERE supervisor_id = $1
       ORDER BY created_at DESC`,
      [supervisor.id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getInternDetails = async (req, res, next) => {
  try {
    const supervisor = await getSupervisorByUserId(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const intern = await query(
      `SELECT
         i.*,
         st.id AS student_id,
         st.full_name,
         st.skills,
         st.phone,
         st.education,
         u.email AS student_email,
         p.title AS project_title,
         p.description AS project_description,
         intp.title AS internship_title
       FROM interns i
       JOIN students st ON st.id = i.student_id
       JOIN users u ON u.id = st.user_id
       JOIN projects p ON p.id = i.project_id
       JOIN internships intp ON intp.id = p.internship_id
       WHERE i.id = $1 AND i.supervisor_id = $2`,
      [req.params.internId, supervisor.id]
    );

    if (intern.rows.length === 0) {
      return res.status(404).json({ message: "Intern not found" });
    }

    const tasks = await query(
      `SELECT id, title, description, deadline, status, created_at
       FROM tasks
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [intern.rows[0].project_id]
    );

    const feedback = await query(
      `SELECT
         f.*,
         u.email AS author_email
       FROM feedbacks f
       JOIN users u ON u.id = f.user_id
       WHERE f.intern_id = $1
       ORDER BY f.created_at DESC`,
      [req.params.internId]
    );

    return res.json({
      ...intern.rows[0],
      tasks: tasks.rows,
      feedback: feedback.rows
    });
  } catch (error) {
    return next(error);
  }
};

export const addInternFeedback = async (req, res, next) => {
  try {
    const internId = req.params.internId;
    const { comment, rating } = req.body;

    const supervisor = await getSupervisorByUserId(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const internOwnership = await query("SELECT id FROM interns WHERE id = $1 AND supervisor_id = $2", [
      internId,
      supervisor.id
    ]);

    if (internOwnership.rows.length === 0) {
      return res.status(403).json({ message: "Intern is not assigned to you" });
    }

    const result = await query(
      `INSERT INTO feedbacks (user_id, intern_id, comment, rating)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, internId, comment, rating ?? null]
    );

    await logAudit(req.user.id, "INTERN_FEEDBACK_ADDED", { internId, feedbackId: result.rows[0].id });
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateInternStatus = async (req, res, next) => {
  try {
    const supervisor = await getSupervisorByUserId(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const intern = await query("SELECT id FROM interns WHERE id = $1 AND supervisor_id = $2", [
      req.params.internId,
      supervisor.id
    ]);

    if (intern.rows.length === 0) {
      return res.status(403).json({ message: "Intern not assigned to you" });
    }

    const result = await query(
      `UPDATE interns
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [req.body.status, req.params.internId]
    );

    await logAudit(req.user.id, "INTERN_STATUS_UPDATED", {
      internId: req.params.internId,
      status: req.body.status
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};
