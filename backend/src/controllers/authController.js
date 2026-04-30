import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool, { query } from "../config/db.js";

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });

export const register = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { name, email, password, role, department, school, startDate, endDate } = req.body;

    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, role]
    );

    const user = userResult.rows[0];

    if (role === "supervisor") {
      await client.query("INSERT INTO supervisors (user_id, department) VALUES ($1, $2)", [
        user.id,
        department || null
      ]);
    }

    if (role === "intern") {
      await client.query(
        "INSERT INTO interns (user_id, school, start_date, end_date) VALUES ($1, $2, $3, $4)",
        [user.id, school || null, startDate || null, endDate || null]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "User registered successfully",
      token: signToken(user),
      user
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: signToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const result = await query("SELECT id, name, email, role FROM users WHERE id = $1", [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};
