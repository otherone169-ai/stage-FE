import { query } from "../config/db.js";

// MEDIUM FIX #3: Enhanced audit logging with more details and error handling
export const logAudit = async (userId, action, metadata = {}) => {
  try {
    const enhancedMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      user_agent: metadata.user_agent || null,
      ip_address: metadata.ip_address || null,
      session_id: metadata.session_id || null
    };

    await query(
      "INSERT INTO audit_logs (user_id, action, metadata) VALUES ($1, $2, $3)", 
      [
        userId || null,
        action,
        JSON.stringify(enhancedMetadata)
      ]
    );
  } catch (error) {
    // Log audit failures but don't crash the application
    console.error("Audit logging failed:", {
      userId,
      action,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Helper functions for common audit events
export const logAuthEvent = async (userId, event, details = {}) => {
  await logAudit(userId, `AUTH_${event}`, {
    category: "authentication",
    ...details
  });
};

export const logProjectEvent = async (userId, event, details = {}) => {
  await logAudit(userId, `PROJECT_${event}`, {
    category: "project_management",
    ...details
  });
};

export const logInternEvent = async (userId, event, details = {}) => {
  await logAudit(userId, `INTERN_${event}`, {
    category: "intern_management",
    ...details
  });
};

export const logSystemEvent = async (userId, event, details = {}) => {
  await logAudit(userId, `SYSTEM_${event}`, {
    category: "system",
    ...details
  });
};
