import { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

// ===== ADMIN MANAGEMENT (CRUD for supervisors) =====

export const listSupervisors = async (req, res, next) => {
  try {
    const values = [];
    const where = [];

    if (req.query.companyId) {
      values.push(req.query.companyId);
      where.push(`s.company_id = $${values.length}`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const result = await query(
      `SELECT 
        s.id, s.user_id, s.full_name, s.position, s.created_at, s.updated_at,
        s.company_id,
        u.email,
        c.name AS company_name,
        COUNT(DISTINCT i.id) as interns_count,
        COUNT(DISTINCT t.id) as tasks_count
      FROM supervisors s
      JOIN users u ON u.id = s.user_id
      JOIN companies c ON c.id = s.company_id
      LEFT JOIN interns i ON i.supervisor_id = s.id AND i.status = 'active'
      LEFT JOIN tasks t ON t.project_id IN (SELECT id FROM projects WHERE supervisor_id = s.id)
      ${whereClause}
      GROUP BY s.id, s.user_id, s.full_name, s.position, s.created_at, s.updated_at, s.company_id, u.email, c.name
      ORDER BY s.created_at DESC`,
      values
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getSupervisorDetails = async (req, res, next) => {
  try {
    const supervisor = await query(
      `SELECT 
        s.id, s.user_id, s.full_name, s.position, s.created_at, s.updated_at,
        s.company_id,
        u.email,
        c.name AS company_name
      FROM supervisors s
      JOIN users u ON u.id = s.user_id
      JOIN companies c ON c.id = s.company_id
      WHERE s.id = $1`,
      [req.params.id]
    );

    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    // Get assigned interns with projects
    const interns = await query(
      `SELECT 
        i.id, i.status, i.start_date, i.end_date,
        st.full_name as student_name,
        p.title as project_title,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_task_count
      FROM interns i
      JOIN students st ON st.id = i.student_id
      JOIN projects p ON p.id = i.project_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE i.supervisor_id = $1
      GROUP BY i.id, st.full_name, p.title
      ORDER BY i.created_at DESC`,
      [req.params.id]
    );

    return res.json({
      ...supervisor.rows[0],
      assigned_interns: interns.rows
    });
  } catch (error) {
    return next(error);
  }
};

export const updateSupervisor = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT * FROM supervisors WHERE id = $1", [req.params.id]);

    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    const result = await query(
      `UPDATE supervisors
       SET full_name = COALESCE($1, full_name),
           position = COALESCE($2, position),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [req.body.fullName ?? null, req.body.position ?? null, req.params.id]
    );

    await logAudit(req.user.id, "SUPERVISOR_UPDATED", {
      supervisorId: req.params.id
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const deleteSupervisor = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT * FROM supervisors WHERE id = $1", [req.params.id]);

    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    // Delete supervisor and cascade
    await query("DELETE FROM supervisors WHERE id = $1", [req.params.id]);

    await logAudit(req.user.id, "SUPERVISOR_DELETED", {
      supervisorId: req.params.id
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

// ===== SUPERVISOR PROFILE (My Profile) =====

export const getMyProfile = async (req, res, next) => {
  try {
    const supervisor = await query(
      `SELECT 
        s.id, s.full_name, s.position, s.created_at, s.updated_at,
        c.id as company_id, c.name as company_name,
        u.email
      FROM supervisors s
      JOIN users u ON u.id = s.user_id
      JOIN companies c ON c.id = s.company_id
      WHERE s.user_id = $1`,
      [req.user.id]
    );

    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    return res.json(supervisor.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `UPDATE supervisors
       SET full_name = COALESCE($1, full_name),
           position = COALESCE($2, position),
           updated_at = NOW()
       WHERE user_id = $3
       RETURNING *`,
      [req.body.fullName ?? null, req.body.position ?? null, req.user.id]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

// ===== SUPERVISOR INTERNS MANAGEMENT =====

export const listMyInterns = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `SELECT 
        i.id, i.status, i.start_date, i.end_date,
        st.id as student_id, st.full_name, st.skills,
        p.id as project_id, p.title as project_title,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT f.id) as feedback_count
      FROM interns i
      JOIN students st ON st.id = i.student_id
      JOIN projects p ON p.id = i.project_id
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN feedbacks f ON f.intern_id = i.id
      WHERE i.supervisor_id = $1
      GROUP BY i.id, st.id, st.full_name, st.skills, p.id, p.title
      ORDER BY i.created_at DESC`,
      [supervisor.rows[0].id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const listCompanyInternships = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT company_id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const result = await query(
      `SELECT id, title, description, location, duration, domain, required_skills, moderation_status, is_active, created_at
       FROM internships
       WHERE company_id = $1 AND moderation_status = 'approved'
       ORDER BY created_at DESC`,
      [supervisor.rows[0].company_id]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getInternDetails = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const intern = await query(
      `SELECT 
        i.*, 
        st.id as student_id, st.full_name, st.skills, st.phone,
        u.email as student_email,
        p.title as project_title, p.description as project_description,
        int.title as internship_title
      FROM interns i
      JOIN students st ON st.id = i.student_id
      JOIN users u ON u.id = st.user_id
      JOIN projects p ON p.id = i.project_id
      JOIN internships int ON int.id = p.internship_id
      WHERE i.id = $1 AND i.supervisor_id = $2`,
      [req.params.internId, supervisor.rows[0].id]
    );

    if (intern.rows.length === 0) {
      return res.status(404).json({ message: "Intern not found" });
    }

    // Get tasks
    const tasks = await query(
      `SELECT id, title, description, deadline, status, created_at
       FROM tasks
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [intern.rows[0].project_id]
    );

    // Get feedback
    const feedback = await query(
      `SELECT * FROM feedbacks
       WHERE intern_id = $1
       ORDER BY created_at DESC`,
      [req.params.internId]
    );

    return res.json({
      ...intern.rows[0],
      tasks: tasks.rows,
      feedback: feedback.rows
    });
  } catch (error) {
    return next(error);
  }
};

export const addInternFeedback = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const internId = req.params.internId;

    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const internOwnership = await query("SELECT id FROM interns WHERE id = $1 AND supervisor_id = $2", [
      internId,
      supervisor.rows[0].id
    ]);

    if (internOwnership.rows.length === 0) {
      return res.status(403).json({ message: "Intern is not assigned to you" });
    }

    const result = await query(
      "INSERT INTO feedbacks (supervisor_id, intern_id, comment) VALUES ($1, $2, $3) RETURNING *",
      [supervisor.rows[0].id, internId, comment]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const updateInternStatus = async (req, res, next) => {
  try {
    const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const intern = await query("SELECT id FROM interns WHERE id = $1 AND supervisor_id = $2", [
      req.params.internId,
      supervisor.rows[0].id
    ]);

    if (intern.rows.length === 0) {
      return res.status(403).json({ message: "Intern not assigned to you" });
    }

    const result = await query(
      `UPDATE interns
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [req.body.status, req.params.internId]
    );

    await logAudit(req.user.id, "INTERN_STATUS_UPDATED", {
      internId: req.params.internId,
      status: req.body.status
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};
