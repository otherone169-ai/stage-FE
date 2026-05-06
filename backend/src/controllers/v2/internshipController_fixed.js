import { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

const buildFilterQuery = (params) => {
  const where = ["i.is_active = true", "i.moderation_status = 'approved'"];
  const values = [];

  if (params.location) {
    values.push(params.location);
    where.push(`i.location ILIKE '%' || $${values.length} || '%'`);
  }

  if (params.domain) {
    values.push(params.domain);
    where.push(`i.domain ILIKE '%' || $${values.length} || '%'`);
  }

  if (params.duration) {
    values.push(params.duration);
    where.push(`i.duration_weeks::text ILIKE '%' || $${values.length} || '%'`);
  }

  if (params.skills) {
    const skills = String(params.skills)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const skill of skills) {
      values.push(skill);
      where.push(`i.description ILIKE '%' || $${values.length} || '%'`);
    }
  }

  return { where: where.join(" AND "), values };
};

export const searchInternships = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const offset = (page - 1) * limit;

    const { where, values } = buildFilterQuery(req.query);
    const whereParts = [where];
    const params = [...values];

    if (req.user.role === "supervisor") {
      const supervisor = await query("SELECT id, company_id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisor.rows.length === 0) {
        return res.status(404).json({ message: "Supervisor profile not found" });
      }

      params.push(supervisor.rows[0].company_id);
      whereParts.push(`i.company_id = $${params.length}`);
    }

    const whereClause = whereParts.join(" AND ");

    const rows = await query(
      `SELECT i.id, i.title, i.description, i.location, i.duration_weeks, i.domain,
              c.name AS company_name, s.full_name as supervisor_name, i.created_at,
              i.start_date, i.end_date
       FROM internships i
       JOIN companies c ON c.id = i.company_id
       JOIN supervisors s ON s.id = i.supervisor_id
       WHERE ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const count = await query(
      `SELECT COUNT(*)::int AS total
       FROM internships i
       WHERE ${whereClause}`,
      params
    );

    return res.json({
      page,
      limit,
      total: count.rows[0].total,
      data: rows.rows
    });
  } catch (error) {
    return next(error);
  }
};

export const createInternship = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id, company_id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const payload = req.body;
    const result = await query(
      `INSERT INTO internships
       (supervisor_id, company_id, title, description, location, domain, start_date, end_date, duration_weeks, moderation_status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', true)
       RETURNING *`,
      [
        supervisor.rows[0].id,
        supervisor.rows[0].company_id,
        payload.title,
        payload.description,
        payload.location || null,
        payload.domain || null,
        payload.start_date || null,
        payload.end_date || null,
        payload.duration_weeks || null
      ]
    );

    await logAudit(req.user.id, "INTERNSHIP_CREATED", { internshipId: result.rows[0].id });
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateInternship = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id, company_id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const payload = req.body;

    const result = await query(
      `UPDATE internships
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           domain = COALESCE($4, domain),
           start_date = COALESCE($5, start_date),
           end_date = COALESCE($6, end_date),
           duration_weeks = COALESCE($7, duration_weeks)
       WHERE id = $8 AND supervisor_id = $9
       RETURNING *`,
      [
        payload.title ?? null,
        payload.description ?? null,
        payload.location ?? null,
        payload.domain ?? null,
        payload.start_date ?? null,
        payload.end_date ?? null,
        payload.duration_weeks ?? null,
        req.params.id,
        supervisor.rows[0].id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Internship not found" });
    }

    await logAudit(req.user.id, "INTERNSHIP_UPDATED", { internshipId: req.params.id });
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateInternshipStatus = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `UPDATE internships
       SET is_active = $1
       WHERE id = $2 AND supervisor_id = $3
       RETURNING *`,
      [req.body.isActive, req.params.id, supervisor.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Internship not found" });
    }

    await logAudit(req.user.id, "INTERNSHIP_STATUS_UPDATED", {
      internshipId: req.params.id,
      isActive: req.body.isActive
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const moderateInternship = async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE internships SET moderation_status = $1 WHERE id = $2 RETURNING *",
      [req.body.moderationStatus, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Internship not found" });
    }

    await logAudit(req.user.id, "INTERNSHIP_MODERATED", {
      internshipId: req.params.id,
      moderationStatus: req.body.moderationStatus
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const listMyInternships = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `SELECT i.*, c.name as company_name
       FROM internships i
       JOIN companies c ON c.id = i.company_id
       WHERE i.supervisor_id = $1 
       ORDER BY i.created_at DESC`,
      [supervisor.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getInternshipById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.*, c.name as company_name, s.full_name as supervisor_name
       FROM internships i
       JOIN companies c ON c.id = i.company_id
       JOIN supervisors s ON s.id = i.supervisor_id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Internship not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const applyToInternship = async (req, res, next) => {
  try {
    const student = await query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const { coverLetter } = req.body;

    // Check if already applied
    const existing = await query(
      "SELECT id FROM applications WHERE student_id = $1 AND internship_id = $2",
      [student.rows[0].id, req.params.id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Already applied to this internship" });
    }

    const result = await query(
      `INSERT INTO applications (student_id, internship_id, cover_letter, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [student.rows[0].id, req.params.id, coverLetter || null]
    );

    await logAudit(req.user.id, "INTERNSHIP_APPLICATION_SUBMITTED", { 
      internshipId: req.params.id,
      applicationId: result.rows[0].id
    });

    return res.status(201).json(result.rows[0]);
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
              c.name as company_name, i.location, i.domain
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [student.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};
