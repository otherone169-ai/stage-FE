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
         COUNT(DISTINCT i.id)::int AS internships_count,
         COUNT(DISTINCT p.id)::int AS projects_count
       FROM supervisors s
       LEFT JOIN internships i ON i.supervisor_id = s.id
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

export const getInternshipStatusDistribution = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END)::int AS pending,
         COUNT(CASE WHEN moderation_status = 'approved' AND is_active = true THEN 1 END)::int AS active,
         COUNT(CASE WHEN moderation_status = 'approved' AND is_active = false THEN 1 END)::int AS completed
       FROM internships`
    );

    return res.json({
      pending: result.rows[0]?.pending || 0,
      active: result.rows[0]?.active || 0,
      completed: result.rows[0]?.completed || 0
    });
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
         a.reviewed_at,
         a.reviewer_notes,
         s.id AS student_id,
         s.full_name,
         s.profile_completed,
         student_user.email AS student_email,
         i.id AS internship_id,
         i.title AS internship_title,
         i.is_active AS internship_is_active,
         sup.id AS supervisor_id,
         sup.company_name,
         sup.full_name AS supervisor_name,
         supervisor_user.email AS supervisor_email,
         latest_project.id AS project_id,
         latest_intern.id AS intern_id,
         latest_intern.status AS intern_status
       FROM applications a
       JOIN students s ON s.id = a.student_id
       JOIN users student_user ON student_user.id = s.user_id
       JOIN internships i ON i.id = a.internship_id
       JOIN supervisors sup ON sup.id = i.supervisor_id
       JOIN users supervisor_user ON supervisor_user.id = sup.user_id
       LEFT JOIN LATERAL (
         SELECT p.id
         FROM projects p
         WHERE p.internship_id = i.id
         ORDER BY p.created_at DESC
         LIMIT 1
       ) latest_project ON TRUE
       LEFT JOIN LATERAL (
         SELECT inr.id, inr.status
         FROM interns inr
         WHERE inr.student_id = s.id
           AND latest_project.id IS NOT NULL
           AND inr.project_id = latest_project.id
         ORDER BY inr.created_at DESC
         LIMIT 1
       ) latest_intern ON TRUE
       ORDER BY a.applied_at DESC, a.id DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};
