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
    where.push(`i.duration ILIKE '%' || $${values.length} || '%'`);
  }

  if (params.skills) {
    const skills = String(params.skills)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const skill of skills) {
      values.push(skill);
      where.push(`LOWER(i.required_skills) LIKE LOWER('%' || $${values.length} || '%')`);
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
      const supervisor = await query("SELECT company_id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisor.rows.length === 0) {
        return res.status(404).json({ message: "Supervisor profile not found" });
      }

      params.push(supervisor.rows[0].company_id);
      whereParts.push(`i.company_id = $${params.length}`);
    }

    const whereClause = whereParts.join(" AND ");

    const rows = await query(
      `SELECT i.id, i.title, i.description, i.location, i.duration, i.domain, i.required_skills,
              c.name AS company_name, i.created_at
       FROM internships i
       JOIN companies c ON c.id = i.company_id
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
    const companyResult = await query("SELECT id FROM companies WHERE user_id = $1", [req.user.id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ message: "Company profile not found" });
    }

    const payload = req.body;
    const result = await query(
      `INSERT INTO internships
       (company_id, title, description, location, duration, domain, requirements, required_skills, moderation_status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', true)
       RETURNING *`,
      [
        companyResult.rows[0].id,
        payload.title,
        payload.description,
        payload.location || null,
        payload.duration || null,
        payload.domain || null,
        payload.requirements || null,
        Array.isArray(payload.requiredSkills) ? payload.requiredSkills.join(",") : ""
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
    const companyResult = await query("SELECT id FROM companies WHERE user_id = $1", [req.user.id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ message: "Company profile not found" });
    }

    const payload = req.body;
    const requiredSkills = Array.isArray(payload.requiredSkills) ? payload.requiredSkills.join(",") : undefined;

    const result = await query(
      `UPDATE internships
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           duration = COALESCE($4, duration),
           domain = COALESCE($5, domain),
           requirements = COALESCE($6, requirements),
           required_skills = COALESCE($7, required_skills)
       WHERE id = $8 AND company_id = $9
       RETURNING *`,
      [
        payload.title ?? null,
        payload.description ?? null,
        payload.location ?? null,
        payload.duration ?? null,
        payload.domain ?? null,
        payload.requirements ?? null,
        requiredSkills ?? null,
        req.params.id,
        companyResult.rows[0].id
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
    const companyResult = await query("SELECT id FROM companies WHERE user_id = $1", [req.user.id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ message: "Company profile not found" });
    }

    const result = await query(
      `UPDATE internships
       SET is_active = $1
       WHERE id = $2 AND company_id = $3
       RETURNING *`,
      [req.body.isActive, req.params.id, companyResult.rows[0].id]
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
    const company = await query("SELECT id FROM companies WHERE user_id = $1", [req.user.id]);
    if (company.rows.length === 0) {
      return res.status(404).json({ message: "Company profile not found" });
    }

    const result = await query(
      "SELECT * FROM internships WHERE company_id = $1 ORDER BY created_at DESC",
      [company.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};
