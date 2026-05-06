import pool, { query } from "../../config/db.js";
import bcrypt from "bcryptjs";
import { logAudit } from "../../utils/audit.js";

export const getSupervisorProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, c.name as company_name, c.description as company_description,
              c.location as company_location, c.website as company_website,
              u.email, u.created_at as user_created_at
       FROM supervisors s
       JOIN companies c ON c.id = s.company_id
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const {
      email,
      password,
      fullName,
      phone,
      education,
      skills,
      experience,
      preferences,
      cvUrl
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create user account
      const hashedPassword = await bcrypt.hash(password, 10);
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role, is_active, is_email_verified)
         VALUES ($1, $2, 'student', true, true)
         RETURNING id, email, created_at`,
        [email.trim().toLowerCase(), hashedPassword]
      );

      // Create student profile
      const studentResult = await client.query(
        `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userResult.rows[0].id,
          supervisor.rows[0].id,
          fullName?.trim() || null,
          phone?.trim() || null,
          education?.trim() || null,
          skills?.trim() || '',
          experience?.trim() || null,
          preferences ? JSON.stringify(preferences) : '{}',
          cvUrl?.trim() || null,
          false
        ]
      );

      await client.query("COMMIT");

      await logAudit(req.user.id, "STUDENT_CREATED", {
        studentId: studentResult.rows[0].id,
        studentEmail: email
      });

      return res.status(201).json({
        user: userResult.rows[0],
        student: studentResult.rows[0]
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: "Email already exists" });
    }
    return next(error);
  }
};

export const getMyStudents = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const result = await query(
      `SELECT s.*, u.email, u.created_at as user_created_at,
              COUNT(DISTINCT i.id) as assigned_projects_count,
              COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END) as active_projects_count
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN interns i ON i.student_id = s.id
       WHERE s.created_by_supervisor_id = $1
       GROUP BY s.id, u.email, u.created_at
       ORDER BY s.created_at DESC`,
      [supervisor.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getAvailableStudents = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const result = await query(
      `SELECT s.*, u.email, u.created_at as user_created_at
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.created_by_supervisor_id = $1
       AND s.id NOT IN (
         SELECT DISTINCT student_id 
         FROM interns 
         WHERE status IN ('active', 'paused')
       )
       ORDER BY s.created_at DESC`,
      [supervisor.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const studentId = req.params.id;
    const { fullName, phone, education, skills, experience, preferences, cvUrl } = req.body;

    // Verify student belongs to this supervisor
    const studentCheck = await query(
      "SELECT id FROM students WHERE id = $1 AND created_by_supervisor_id = $2",
      [studentId, supervisor.rows[0].id]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Student not found or not authorized" });
    }

    const result = await query(
      `UPDATE students
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           education = COALESCE($3, education),
           skills = COALESCE($4, skills),
           experience = COALESCE($5, experience),
           preferences = COALESCE($6, preferences),
           cv_url = COALESCE($7, cv_url),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        fullName ?? null,
        phone ?? null,
        education ?? null,
        skills ?? null,
        experience ?? null,
        preferences ? JSON.stringify(preferences) : null,
        cvUrl ?? null,
        studentId
      ]
    );

    await logAudit(req.user.id, "STUDENT_UPDATED", {
      studentId: studentId
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const studentId = req.params.id;

    // Verify student belongs to this supervisor
    const studentCheck = await query(
      "SELECT id, u.email FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = $1 AND s.created_by_supervisor_id = $2",
      [studentId, supervisor.rows[0].id]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Student not found or not authorized" });
    }

    // Check if student has active assignments
    const activeAssignments = await query(
      "SELECT COUNT(*) as count FROM interns WHERE student_id = $1 AND status IN ('active', 'paused')",
      [studentId]
    );

    if (parseInt(activeAssignments.rows[0].count) > 0) {
      return res.status(409).json({ 
        message: "Cannot delete student with active assignments" 
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete student (cascade will handle related records)
      await client.query("DELETE FROM students WHERE id = $1", [studentId]);

      await client.query("COMMIT");

      await logAudit(req.user.id, "STUDENT_DELETED", {
        studentId: studentId,
        studentEmail: studentCheck.rows[0].email
      });

      return res.json({
        message: "Student deleted successfully",
        studentId: studentId
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return next(error);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized as supervisor" });
    }

    const result = await query(
      `SELECT s.*, u.email, u.created_at as user_created_at,
              COUNT(DISTINCT i.id) as total_assignments,
              COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END) as active_assignments,
              COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END) as completed_assignments
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN interns i ON i.student_id = s.id
       WHERE s.id = $1 AND s.created_by_supervisor_id = $2
       GROUP BY s.id, u.email, u.created_at`,
      [req.params.id, supervisor.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};
