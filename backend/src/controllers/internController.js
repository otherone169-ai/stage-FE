import bcrypt from "bcryptjs";
import { query } from "../config/db.js";

export const listInterns = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.id, u.id AS user_id, u.name, u.email, i.school, i.start_date, i.end_date, i.supervisor_id,
              su.name AS supervisor_name
       FROM interns i
       JOIN users u ON u.id = i.user_id
       LEFT JOIN supervisors s ON s.id = i.supervisor_id
       LEFT JOIN users su ON su.id = s.user_id
       ORDER BY i.id DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getInternById = async (req, res, next) => {
  try {
    const internId = Number(req.params.id);
    const result = await query(
      `SELECT i.id, u.id AS user_id, u.name, u.email, i.school, i.start_date, i.end_date, i.supervisor_id,
              su.name AS supervisor_name
       FROM interns i
       JOIN users u ON u.id = i.user_id
       LEFT JOIN supervisors s ON s.id = i.supervisor_id
       LEFT JOIN users su ON su.id = s.user_id
       WHERE i.id = $1`,
      [internId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Intern not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const createIntern = async (req, res, next) => {
  try {
    const { name, email, password, school, startDate, endDate, supervisorId } = req.body;

    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'intern') RETURNING id, name, email, role",
      [name, email, hashedPassword]
    );

    const internResult = await query(
      `INSERT INTO interns (user_id, school, start_date, end_date, supervisor_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, school, start_date, end_date, supervisor_id`,
      [userResult.rows[0].id, school || null, startDate || null, endDate || null, supervisorId || null]
    );

    return res.status(201).json({
      ...internResult.rows[0],
      user: userResult.rows[0]
    });
  } catch (error) {
    return next(error);
  }
};

export const updateIntern = async (req, res, next) => {
  try {
    const internId = Number(req.params.id);
    const { name, school, startDate, endDate, supervisorId } = req.body;

    const internResult = await query("SELECT id, user_id FROM interns WHERE id = $1", [internId]);
    if (internResult.rows.length === 0) {
      return res.status(404).json({ message: "Intern not found" });
    }

    if (name) {
      await query("UPDATE users SET name = $1 WHERE id = $2", [name, internResult.rows[0].user_id]);
    }

    await query(
      `UPDATE interns
       SET school = COALESCE($1, school),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           supervisor_id = COALESCE($4, supervisor_id),
           updated_at = NOW()
       WHERE id = $5`,
      [school || null, startDate || null, endDate || null, supervisorId || null, internId]
    );

    return res.json({ message: "Intern updated successfully" });
  } catch (error) {
    return next(error);
  }
};

export const deleteIntern = async (req, res, next) => {
  try {
    const internId = Number(req.params.id);
    const internResult = await query("SELECT user_id FROM interns WHERE id = $1", [internId]);

    if (internResult.rows.length === 0) {
      return res.status(404).json({ message: "Intern not found" });
    }

    await query("DELETE FROM interns WHERE id = $1", [internId]);
    await query("DELETE FROM users WHERE id = $1", [internResult.rows[0].user_id]);

    return res.json({ message: "Intern deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const assignSupervisor = async (req, res, next) => {
  try {
    const internId = Number(req.params.id);
    const { supervisorId } = req.body;

    const supervisor = await query("SELECT id FROM supervisors WHERE id = $1", [supervisorId]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    const updated = await query(
      "UPDATE interns SET supervisor_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id",
      [supervisorId, internId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "Intern not found" });
    }

    return res.json({ message: "Supervisor assigned successfully" });
  } catch (error) {
    return next(error);
  }
};
