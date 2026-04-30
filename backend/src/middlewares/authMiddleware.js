import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = await query("SELECT id, email, role, is_active FROM users WHERE id = $1", [decoded.id]);

    if (dbUser.rows.length === 0 || !dbUser.rows[0].is_active) {
      return res.status(401).json({ message: "Account not active" });
    }

    req.user = dbUser.rows[0];
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || typeof req.user.role !== "string" || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};