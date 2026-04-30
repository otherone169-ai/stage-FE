import { query } from "../config/db.js";

export const logAudit = async (userId, action, metadata = {}) => {
  await query("INSERT INTO audit_logs (user_id, action, metadata) VALUES ($1, $2, $3)", [
    userId || null,
    action,
    metadata
  ]);
};
