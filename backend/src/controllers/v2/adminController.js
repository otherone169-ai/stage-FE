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
         u.id AS user_id,
         u.email,
         u.is_active,
         u.created_at,
         c.id AS company_id,
         c.name AS company_name,
         c.description AS company_description,
         c.location AS company_location,
         c.website AS company_website,
         (
           SELECT COUNT(*)::int
           FROM internships i
           WHERE i.company_id = c.id
         ) AS internships_count,
         (
           SELECT COUNT(*)::int
           FROM supervisors s
           WHERE s.company_id = c.id
         ) AS supervisors_count
       FROM users u
       LEFT JOIN companies c ON c.user_id = u.id
       WHERE u.role = 'company'
       ORDER BY c.name ASC NULLS LAST, u.created_at DESC`
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
         (
           SELECT COUNT(*)::int
           FROM applications a
           WHERE a.student_id = s.id
         ) AS applications_count,
         (
           SELECT COUNT(*)::int
           FROM applications a
           WHERE a.student_id = s.id AND a.status = 'accepted'
         ) AS accepted_applications_count
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
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
      `SELECT 
         role,
         COUNT(*) as count
       FROM users 
       WHERE is_active = true
       GROUP BY role`
    );

    const distribution = {
      students: 0,
      supervisors: 0,
      admins: 0
    };

    result.rows.forEach(row => {
      if (row.role === 'student') distribution.students = parseInt(row.count);
      if (row.role === 'supervisor') distribution.supervisors = parseInt(row.count);
      if (row.role === 'admin') distribution.admins = parseInt(row.count);
    });

    return res.json(distribution);
  } catch (error) {
    return next(error);
  }
};

export const getInternshipStatusDistribution = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
         COUNT(CASE WHEN i.moderation_status = 'pending' THEN 1 END) as pending,
         COUNT(CASE WHEN i.moderation_status = 'approved' AND i.is_active = true THEN 1 END) as active,
         COUNT(CASE WHEN i.moderation_status = 'approved' AND i.is_active = false THEN 1 END) as completed
       FROM internships i`
    );

    const distribution = {
      pending: parseInt(result.rows[0]?.pending || 0),
      active: parseInt(result.rows[0]?.active || 0),
      completed: parseInt(result.rows[0]?.completed || 0)
    };

    return res.json(distribution);
  } catch (error) {
    return next(error);
  }
};

export const listApplications = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         a.id AS application_id,
         a.status,
         a.applied_at,
         s.id AS student_id,
         s.full_name,
         s.profile_completed,
         student_user.email AS student_email,
         i.id AS internship_id,
         i.title AS internship_title,
         i.is_active AS internship_is_active,
         c.id AS company_id,
         c.name AS company_name,
         company_user.email AS company_email,
         latest_project.id AS project_id,
         latest_intern.id AS intern_id,
         latest_intern.status AS intern_status,
         supervisor.full_name AS supervisor_name
       FROM applications a
       JOIN students s ON s.id = a.student_id
       JOIN users student_user ON student_user.id = s.user_id
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       JOIN users company_user ON company_user.id = c.user_id
       LEFT JOIN LATERAL (
         SELECT p.id, p.supervisor_id
         FROM projects p
         WHERE p.internship_id = i.id
         ORDER BY p.created_at DESC
         LIMIT 1
       ) latest_project ON TRUE
       LEFT JOIN LATERAL (
         SELECT inr.id, inr.supervisor_id, inr.status
         FROM interns inr
         WHERE inr.student_id = s.id
           AND latest_project.id IS NOT NULL
           AND inr.project_id = latest_project.id
         ORDER BY inr.created_at DESC
         LIMIT 1
       ) latest_intern ON TRUE
       LEFT JOIN supervisors supervisor
         ON supervisor.id = COALESCE(latest_intern.supervisor_id, latest_project.supervisor_id)
       ORDER BY a.applied_at DESC, a.id DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};
