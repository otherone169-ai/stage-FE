import { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const listUsers = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at DESC"
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const suspendUser = async (req, res, next) => {
  try {
    const result = await query("UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id", [
      req.body.isActive,
      req.params.userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await logAudit(req.user.id, "ADMIN_USER_STATUS_CHANGED", {
      targetUserId: req.params.userId,
      isActive: req.body.isActive
    });

    return res.json({ message: "User status updated" });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [req.params.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await logAudit(req.user.id, "ADMIN_USER_DELETED", { targetUserId: req.params.userId });
    return res.json({ message: "User deleted" });
  } catch (error) {
    return next(error);
  }
};

export const listCompanyRhProfiles = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         company_name,
         MAX(company_description) AS company_description,
         MAX(company_location) AS company_location,
         MAX(company_website) AS company_website,
         COUNT(*)::int AS supervisors_count,
         COUNT(DISTINCT p.id)::int AS projects_count
       FROM supervisors s
       LEFT JOIN projects p ON p.supervisor_id = s.id
       GROUP BY company_name
       ORDER BY company_name ASC`
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const listStudentProfiles = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         u.id AS user_id,
         u.email,
         u.is_active,
         u.created_at,
         s.id AS student_id,
         s.full_name,
         s.phone,
         s.education,
         s.skills,
         s.experience,
         s.preferences,
         s.cv_url,
         s.profile_completed,
         sup.full_name AS created_by_supervisor_name,
         sup.company_name,
         (
           SELECT COUNT(*)::int
           FROM interns i
           WHERE i.student_id = s.id
         ) AS assignments_count,
         (
           SELECT COUNT(*)::int
           FROM interns i
           WHERE i.student_id = s.id AND i.status IN ('active', 'paused')
         ) AS active_assignments_count
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN supervisors sup ON sup.id = s.created_by_supervisor_id
       WHERE u.role = 'student'
       ORDER BY s.full_name ASC NULLS LAST, u.created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const listSupervisors = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         u.id AS user_id,
         u.email,
         u.is_active,
         u.created_at,
         s.id AS supervisor_id,
         s.full_name,
         s.position,
         s.company_name,
         s.company_description,
         s.company_website,
         s.company_location,
         (
           SELECT COUNT(*)::int
           FROM interns i
           WHERE i.supervisor_id = s.id
         ) AS interns_count,
         (
           SELECT COUNT(*)::int
           FROM projects p
           WHERE p.supervisor_id = s.id
         ) AS projects_count
       FROM users u
       LEFT JOIN supervisors s ON s.user_id = u.id
       WHERE u.role = 'supervisor'
       ORDER BY s.full_name ASC NULLS LAST, u.created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getUsersDistribution = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT role, COUNT(*)::int AS count
       FROM users
       WHERE is_active = true
       GROUP BY role`
    );

    const distribution = {
      students: 0,
      supervisors: 0,
      admins: 0
    };

    result.rows.forEach((row) => {
      if (row.role === "student") distribution.students = row.count;
      if (row.role === "supervisor") distribution.supervisors = row.count;
      if (row.role === "admin") distribution.admins = row.count;
    });

    return res.json(distribution);
  } catch (error) {
    return next(error);
  }
};

export const getAssignmentStatusDistribution = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active')::int AS active,
         COUNT(*) FILTER (WHERE status = 'paused')::int AS paused,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
         COUNT(*) FILTER (WHERE status = 'terminated')::int AS terminated
       FROM interns`
    );

    return res.json({
      active: result.rows[0]?.active || 0,
      paused: result.rows[0]?.paused || 0,
      completed: result.rows[0]?.completed || 0,
      terminated: result.rows[0]?.terminated || 0
    });
  } catch (error) {
    return next(error);
  }
};
