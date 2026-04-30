import bcrypt from "bcryptjs";
import { query } from "../config/db.js";

export const listSupervisors = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.id, s.user_id, u.name, u.email, s.department,
              COUNT(i.id)::int AS interns_count
       FROM supervisors s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN interns i ON i.supervisor_id = s.id
       GROUP BY s.id, s.user_id, u.name, u.email, s.department
       ORDER BY s.id DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const createSupervisor = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;

    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'supervisor') RETURNING id, name, email, role",
      [name, email, hashedPassword]
    );

    const supervisorResult = await query(
      "INSERT INTO supervisors (user_id, department) VALUES ($1, $2) RETURNING id, user_id, department",
      [userResult.rows[0].id, department || null]
    );

    return res.status(201).json({
      ...supervisorResult.rows[0],
      user: userResult.rows[0]
    });
  } catch (error) {
    return next(error);
  }
};

export const updateSupervisor = async (req, res, next) => {
  try {
    const supervisorId = Number(req.params.id);
    const { name, department } = req.body;

    const supervisorResult = await query("SELECT user_id FROM supervisors WHERE id = $1", [supervisorId]);
    if (supervisorResult.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    if (name) {
      await query("UPDATE users SET name = $1 WHERE id = $2", [
        name,
        supervisorResult.rows[0].user_id
      ]);
    }

    await query(
      "UPDATE supervisors SET department = COALESCE($1, department), updated_at = NOW() WHERE id = $2",
      [department || null, supervisorId]
    );

    return res.json({ message: "Supervisor updated successfully" });
  } catch (error) {
    return next(error);
  }
};

export const deleteSupervisor = async (req, res, next) => {
  try {
    const supervisorId = Number(req.params.id);
    const supervisorResult = await query("SELECT user_id FROM supervisors WHERE id = $1", [supervisorId]);

    if (supervisorResult.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    await query("UPDATE interns SET supervisor_id = NULL WHERE supervisor_id = $1", [supervisorId]);
    await query("DELETE FROM supervisors WHERE id = $1", [supervisorId]);
    await query("DELETE FROM users WHERE id = $1", [supervisorResult.rows[0].user_id]);

    return res.json({ message: "Supervisor deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
