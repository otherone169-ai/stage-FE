import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import pool, { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";
import { sendMail } from "../../utils/mailer.js";

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });

const getAppBaseUrl = () => process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || "http://localhost:5173";

const hashToken = (rawToken) => crypto.createHash("sha256").update(rawToken).digest("hex");

const issueEmailVerificationToken = async (client, userId) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  await client.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
    [userId, tokenHash]
  );

  return rawToken;
};

const sendEmailVerificationMail = async (email, rawToken) => {
  const appBaseUrl = getAppBaseUrl();
  const verifyUrl = `${appBaseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

  await sendMail({
    to: email,
    subject: "Verifiez votre email - StageFlow",
    text: `Bienvenue sur StageFlow. Verifiez votre email en ouvrant ce lien: ${verifyUrl}`,
    html: `<p>Bienvenue sur <strong>StageFlow</strong>.</p><p>Veuillez verifier votre email en cliquant ici:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  });
};

const sendPasswordResetMail = async (email, rawToken) => {
  const appBaseUrl = getAppBaseUrl();
  const resetUrl = `${appBaseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await sendMail({
    to: email,
    subject: "Reinitialisation de mot de passe - StageFlow",
    text: `Vous avez demande une reinitialisation de mot de passe. Utilisez ce lien: ${resetUrl}`,
    html: `<p>Vous avez demande une reinitialisation de mot de passe.</p><p>Cliquez ici pour definir un nouveau mot de passe:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ce lien expire dans 30 minutes.</p>`
  });
};

export const register = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { email, password, fullName, companyName, companyDescription, companyLocation, companyWebsite, position } = req.body;
    const role = "supervisor";

    await client.query("BEGIN");

    const exists = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      "INSERT INTO users (email, password_hash, role, is_active, is_email_verified) VALUES ($1, $2, $3, true, false) RETURNING id, email, role",
      [email, passwordHash, role]
    );
    const user = userResult.rows[0];

    const companyResult = await client.query(
      `INSERT INTO companies (user_id, name, description, location, website)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [user.id, companyName, companyDescription || null, companyLocation || null, companyWebsite || null]
    );

    await client.query(
      `INSERT INTO supervisors (user_id, company_id, full_name, position)
       VALUES ($1, $2, $3, $4)`,
      [user.id, companyResult.rows[0].id, fullName, position || null]
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
      "SELECT id, email, role, password_hash, is_active, is_email_verified FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match || !user.is_active) {
      return res.status(401).json({ message: "Invalid credentials or suspended account" });
    }

    if (!user.is_email_verified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email before logging in."
      });
    }

    await logAudit(user.id, "AUTH_LOGIN", {});

    return res.json({
      token: signToken(user),
      user: {
        id: user.id,
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
    const base = await query("SELECT id, email, role, is_active, is_email_verified, created_at FROM users WHERE id = $1", [
      req.user.id
    ]);

    if (base.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = base.rows[0];
    let profile = null;

    if (user.role === "student") {
      const p = await query("SELECT * FROM students WHERE user_id = $1", [user.id]);
      profile = p.rows[0] || null;
    } else if (user.role === "company") {
      const p = await query("SELECT * FROM companies WHERE user_id = $1", [user.id]);
      profile = p.rows[0] || null;
    } else if (user.role === "supervisor") {
      const p = await query("SELECT * FROM supervisors WHERE user_id = $1", [user.id]);
      profile = p.rows[0] || null;
    }

    return res.json({ user, profile });
  } catch (error) {
    return next(error);
  }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await query("SELECT id FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.json({ message: "If this email exists, a reset token has been generated" });
    }

    const userId = result.rows[0].id;
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [userId, tokenHash]
    );

    await sendPasswordResetMail(email, rawToken);

    await logAudit(userId, "AUTH_PASSWORD_RESET_REQUEST", {});

    return res.json({
      message: "If this email exists, a password reset link has been sent"
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { token, newPassword } = req.body;
    const tokenHash = hashToken(token);

    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY expires_at DESC
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      tokenResult.rows[0].user_id
    ]);

    // CRITICAL FIX #2: Delete token after use to prevent reuse attacks
    await client.query("DELETE FROM password_reset_tokens WHERE id = $1", [
      tokenResult.rows[0].id
    ]);

    await client.query("COMMIT");
    await logAudit(tokenResult.rows[0].user_id, "AUTH_PASSWORD_RESET", {});

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await query("SELECT id, password_hash FROM users WHERE id = $1", [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    const currentPasswordMatches = await bcrypt.compare(currentPassword, user.password_hash);

    if (!currentPasswordMatches) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const reusesCurrentPassword = await bcrypt.compare(newPassword, user.password_hash);
    if (reusesCurrentPassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, req.user.id]);

    await logAudit(req.user.id, "AUTH_PASSWORD_CHANGED", {});

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { token } = req.body;
    const tokenHash = hashToken(token);

    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT id, user_id
       FROM email_verification_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY expires_at DESC
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    const verification = tokenResult.rows[0];

    await client.query("UPDATE users SET is_email_verified = true WHERE id = $1", [verification.user_id]);
    await client.query("UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1", [verification.id]);

    await client.query("COMMIT");
    await logAudit(verification.user_id, "AUTH_EMAIL_VERIFIED", {});

    return res.json({ message: "Email verified successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

export const resendVerificationEmail = async (req, res, next) => {
  const client = await pool.connect();
  let inTransaction = false;

  try {
    const { email } = req.body;
    const userResult = await client.query(
      "SELECT id, email, is_email_verified FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.json({ message: "If this email exists, a verification link has been sent" });
    }

    const user = userResult.rows[0];
    if (user.is_email_verified) {
      return res.json({ message: "Email already verified" });
    }

    await client.query("BEGIN");
    inTransaction = true;
    const rawToken = await issueEmailVerificationToken(client, user.id);
    await client.query("COMMIT");
    inTransaction = false;

    await sendEmailVerificationMail(user.email, rawToken);
    await logAudit(user.id, "AUTH_EMAIL_VERIFICATION_RESENT", {});

    return res.json({ message: "If this email exists, a verification link has been sent" });
  } catch (error) {
    if (inTransaction) {
      await client.query("ROLLBACK");
    }
    return next(error);
  } finally {
    client.release();
  }
};
