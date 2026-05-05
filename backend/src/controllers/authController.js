import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool, { query } from "../config/db.js";

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });

export const register = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { email, password, fullName, companyName, companyDescription, companyLocation, companyWebsite, position } = req.body;
    const role = "supervisor";

    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      "INSERT INTO users (email, password_hash, role, is_active, is_email_verified) VALUES ($1, $2, $3, true, false) RETURNING id, email, role",
      [email, passwordHash, role]
    );
    const user = userResult.rows[0];

    // Insert supervisor with company information directly
    const supervisorResult = await client.query(
      `INSERT INTO supervisors (user_id, full_name, position, company_name, company_description, company_location, company_website)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [user.id, fullName, position || null, companyName, companyDescription || null, companyLocation || null, companyWebsite || null]
    );

    const verificationToken = await issueEmailVerificationToken(client, user.id);

    await client.query("COMMIT");
    await sendEmailVerificationMail(user.email, verificationToken);
    await logAudit(user.id, "AUTH_REGISTER", { role: "supervisor" });

    return res.status(201).json({
      message: "Registration successful. Verification email sent."
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
      `SELECT u.id, u.email, u.password_hash, u.role, u.is_active,
              CASE 
                WHEN u.role = 'student' THEN s.full_name
                WHEN u.role = 'supervisor' THEN sp.full_name
                WHEN u.role = 'admin' THEN 'Administrator'
                ELSE u.email
              END as full_name
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN supervisors sp ON sp.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ message: "Account is disabled" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    await logAudit(user.id, "AUTH_LOGIN", { email });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.is_active, u.is_email_verified,
              CASE 
                WHEN u.role = 'student' THEN s.full_name
                WHEN u.role = 'supervisor' THEN sp.full_name
                WHEN u.role = 'admin' THEN 'Administrator'
                ELSE u.email
              END as full_name
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN supervisors sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [newPasswordHash, req.user.id]);
    
    await logAudit(req.user.id, "PASSWORD_CHANGED", {});
    
    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    return next(error);
  }
};

// Helper functions (these should be imported from utils)
const issueEmailVerificationToken = async (client, userId) => {
  const rawToken = Math.random().toString(36).slice(-12);
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  
  await client.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
    [userId, tokenHash]
  );
  
  return rawToken;
};

const sendEmailVerificationMail = async (email, token) => {
  // This should be implemented using your mail service
  console.log(`Email verification sent to ${email} with token ${token}`);
};

const logAudit = async (userId, action, metadata) => {
  await query(
    "INSERT INTO audit_logs (user_id, action, metadata) VALUES ($1, $2, $3)",
    [userId, action, metadata]
  );
};
