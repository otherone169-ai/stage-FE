import bcrypt from "bcryptjs";
import pool, { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";
export const getMyCompanyProfile = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM companies WHERE user_id = $1", [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Company profile not found" });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateMyCompanyProfile = async (req, res, next) => {
  try {
    const current = await query("SELECT * FROM companies WHERE user_id = $1", [req.user.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: "Company profile not found" });
    }

    const profile = current.rows[0];

    const result = await query(
      `UPDATE companies
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           website = COALESCE($4, website),
           updated_at = NOW()
       WHERE user_id = $5
       RETURNING *`,
      [
        req.body.name ?? null,
        req.body.description ?? null,
        req.body.location ?? null,
        req.body.website ?? null,
        req.user.id
      ]
    );

    await logAudit(req.user.id, "COMPANY_PROFILE_UPDATED", {
      previousName: profile.name,
      newName: result.rows[0].name
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const monitorInterns = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT inr.id AS intern_id, st.full_name AS student_name, inr.status AS internship_status,
              p.title AS project_title,
              COUNT(t.id)::int AS tasks_count,
              COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS tasks_done
       FROM companies c
       JOIN internships i ON i.company_id = c.id
       JOIN projects p ON p.internship_id = i.id
       JOIN interns inr ON inr.project_id = p.id
       JOIN students st ON st.id = inr.student_id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE c.user_id = $1
       GROUP BY inr.id
       ORDER BY st.full_name`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const updateCompanyInternStatus = async (req, res, next) => {
  try {
    const ownership = await query(
      `SELECT inr.id
       FROM interns inr
       JOIN projects p ON p.id = inr.project_id
       JOIN internships i ON i.id = p.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE inr.id = $1 AND c.user_id = $2`,
      [req.params.internId, req.user.id]
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({ message: "Intern record not found" });
    }

    const result = await query("UPDATE interns SET status = $1 WHERE id = $2 RETURNING *", [
      req.body.status,
      req.params.internId
    ]);

    await logAudit(req.user.id, "COMPANY_INTERN_STATUS_UPDATED", {
      internId: req.params.internId,
      status: req.body.status
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

// I just did step 3
export const listMySupervisors = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.id, s.full_name, s.position, s.company_id, s.created_at, u.email
       FROM supervisors s
       JOIN users u ON u.id = s.user_id
       JOIN companies c ON c.id = s.company_id
       WHERE c.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const createSupervisorForCompany = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const companyResult = await client.query(
      "SELECT id FROM companies WHERE user_id = $1",
      [req.user.id]
    );

    if (companyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Company profile not found" });
    }

    const exists = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [req.body.email]
    );

    if (exists.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active, is_email_verified)
       VALUES ($1, $2, 'supervisor', true, true)
       RETURNING id, email`,
      [req.body.email, passwordHash]
    );

    const supervisorResult = await client.query(
      `INSERT INTO supervisors (user_id, company_id, full_name, position)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, company_id, full_name, position, created_at`,
      [
        userResult.rows[0].id,
        companyResult.rows[0].id,
        req.body.fullName,
        req.body.position || null
      ]
    );

    await client.query("COMMIT");

    await logAudit(req.user.id, "COMPANY_SUPERVISOR_CREATED", {
      supervisorId: supervisorResult.rows[0].id
    });

    return res.status(201).json({
      ...supervisorResult.rows[0],
      email: userResult.rows[0].email
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};
