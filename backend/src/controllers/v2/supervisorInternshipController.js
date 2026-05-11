import crypto from "crypto";
import bcrypt from "bcryptjs";
import pool, { query } from "../../config/db.js";
import { sendMail } from "../../utils/mailer.js";

const getSupervisor = async (userId) => {
  const supervisor = await query("SELECT * FROM supervisors WHERE user_id = $1", [userId]);
  return supervisor.rows[0] || null;
};

const computeDurationWeeks = (startDate, endDate) => {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  return Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
};

const getAppBaseUrl = () => process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || "http://localhost:5173";

const hashToken = (rawToken) => crypto.createHash("sha256").update(rawToken).digest("hex");

const issuePasswordResetToken = async (client, userId) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  await client.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
    [userId, tokenHash]
  );

  return rawToken;
};

const sendPasswordSetupMail = async (email, rawToken) => {
  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await sendMail({
    to: email,
    subject: "Set your StageFlow password",
    text: `Your intern account is ready. Set your password here: ${resetUrl}`,
    html: `<p>Your intern account is ready.</p><p>Set your password here:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`
  });
};

const buildProjectNotificationText = (projectTitle, projectDescription, taskTitles) => {
  const lines = [
    `Your StageFlow project is ready: ${projectTitle}`,
    projectDescription ? `Description: ${projectDescription}` : null,
    taskTitles.length > 0 ? "Tasks:" : null,
    taskTitles.length > 0 ? taskTitles.map((task, index) => `${index + 1}. ${task}`).join("\n") : null
  ].filter(Boolean);

  return lines.join("\n\n");
};

export const getSupervisorInternships = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const internships = await query(
      `SELECT
         i.id,
         i.title,
         i.description,
         i.location,
         i.domain,
         i.start_date,
         i.end_date,
         i.duration_weeks,
         i.moderation_status,
         i.is_active,
         i.created_at
       FROM internships i
       WHERE i.supervisor_id = $1
       ORDER BY i.created_at DESC`,
      [supervisor.id]
    );

    return res.json(internships.rows);
  } catch (error) {
    return next(error);
  }
};

export const createInternshipForSupervisor = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const { title, description, location, domain, startDate, endDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    const durationWeeks = computeDurationWeeks(startDate, endDate);
    if (startDate && endDate && !durationWeeks) {
      return res.status(400).json({ error: "Invalid dates. endDate must be after startDate" });
    }

    const internship = await query(
      `INSERT INTO internships
         (supervisor_id, title, description, location, domain, start_date, end_date, duration_weeks, moderation_status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', true)
       RETURNING id, title, description, location, domain, start_date, end_date, duration_weeks, created_at`,
      [
        supervisor.id,
        title,
        description,
        location || null,
        domain || null,
        startDate || null,
        endDate || null,
        durationWeeks
      ]
    );

    return res.status(201).json(internship.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const getSupervisorStudents = async (req, res, next) => {
  try {
    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const { internshipId } = req.params;
    const internship = await query(
      `SELECT id
       FROM internships
       WHERE id = $1 AND supervisor_id = $2`,
      [internshipId, supervisor.id]
    );

    if (internship.rows.length === 0) {
      return res.status(404).json({ error: "Internship not found" });
    }

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM interns i
       JOIN projects p ON p.id = i.project_id
       WHERE p.internship_id = $1`,
      [internshipId]
    );

    const students = await query(
      `SELECT
         i.id,
         s.id AS student_id,
         s.full_name,
         u.email,
         s.cv_url,
         i.status,
         i.start_date,
         i.end_date,
         i.created_at,
         p.id AS project_id,
         p.title AS project_title
       FROM interns i
       JOIN students s ON i.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN projects p ON p.id = i.project_id
       WHERE p.internship_id = $1
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [internshipId, limit, offset]
    );

    const total = countResult.rows[0]?.total || 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return res.json({
      data: students.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const addStudentToInternship = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const internshipId = req.params.internshipId || req.body.internshipId;
    const { studentId, fullName, email, phone, education, skills, experience, startDate, endDate, projectId } =
      req.body;

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const resolvedFullName =
      typeof fullName === "string" && fullName.trim()
        ? fullName.trim()
        : normalizedEmail.split("@")[0] || "Intern";

    if (!internshipId) {
      return res.status(400).json({ error: "internshipId required" });
    }

    if (!studentId && !normalizedEmail) {
      return res.status(400).json({ error: "Provide studentId or email" });
    }

    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const internship = await query(
      `SELECT id, title, description, location, domain
       FROM internships
       WHERE id = $1 AND supervisor_id = $2`,
      [internshipId, supervisor.id]
    );

    if (internship.rows.length === 0) {
      return res.status(404).json({ error: "Internship not found" });
    }

    const durationWeeks = computeDurationWeeks(startDate, endDate);
    if (startDate && endDate && !durationWeeks) {
      return res.status(400).json({ error: "Invalid dates. endDate must be after startDate" });
    }

    await client.query("BEGIN");

    let resolvedProjectId = projectId || null;
    if (resolvedProjectId) {
      const existingProject = await client.query(
        `SELECT id
         FROM projects
         WHERE id = $1 AND internship_id = $2 AND supervisor_id = $3`,
        [resolvedProjectId, internshipId, supervisor.id]
      );

      if (existingProject.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Provided projectId is invalid for this internship" });
      }
    } else {
      const existingProject = await client.query(
        `SELECT id
         FROM projects
         WHERE internship_id = $1 AND supervisor_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [internshipId, supervisor.id]
      );

      if (existingProject.rows.length > 0) {
        resolvedProjectId = existingProject.rows[0].id;
      } else {
        const createdProject = await client.query(
          `INSERT INTO projects
             (internship_id, supervisor_id, title, description, objectives, location, duration, domain)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            internshipId,
            supervisor.id,
            `Project for ${internship.rows[0].title}`.slice(0, 180),
            internship.rows[0].description || null,
            internship.rows[0].description || null,
            internship.rows[0].location || null,
            durationWeeks ? `${durationWeeks} weeks` : null,
            internship.rows[0].domain || null
          ]
        );

        resolvedProjectId = createdProject.rows[0].id;
      }
    }

    let resolvedStudentId = studentId || null;
    let studentUserId = null;
    let passwordSetupToken = null;
    let shouldSendPasswordSetup = false;

    if (!resolvedStudentId) {
      const existingUser = await client.query("SELECT id, role FROM users WHERE email = $1", [normalizedEmail]);

      if (existingUser.rows.length > 0 && existingUser.rows[0].role !== "student") {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Email already used by a non-student account" });
      }

      if (existingUser.rows.length === 0) {
        const randomPassword = crypto.randomBytes(12).toString("hex");
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        const userInsert = await client.query(
          `INSERT INTO users (email, password_hash, role, is_active, is_email_verified)
           VALUES ($1, $2, 'student', true, true)
           RETURNING id`,
          [normalizedEmail, passwordHash]
        );
        studentUserId = userInsert.rows[0].id;
        shouldSendPasswordSetup = true;
      } else {
        studentUserId = existingUser.rows[0].id;
      }

      const existingStudent = await client.query("SELECT id FROM students WHERE user_id = $1", [studentUserId]);

      if (existingStudent.rows.length > 0) {
        resolvedStudentId = existingStudent.rows[0].id;

        if (req.file) {
          const fileUrl = `/uploads/${req.file.filename}`;
          await client.query(
            `UPDATE students
             SET cv_url = $1, updated_at = NOW()
             WHERE id = $2`,
            [fileUrl, resolvedStudentId]
          );
        }
      } else {
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const skillsCsv = Array.isArray(skills)
          ? skills.join(",")
          : typeof skills === "string"
            ? skills
            : "";

        const studentInsert = await client.query(
          `INSERT INTO students
             (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, cv_url, profile_completed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            studentUserId,
            supervisor.id,
            resolvedFullName,
            phone || null,
            education || null,
            skillsCsv,
            experience || null,
            fileUrl,
            Boolean(resolvedFullName && fileUrl)
          ]
        );

        resolvedStudentId = studentInsert.rows[0].id;
      }
    } else {
      const existingStudent = await client.query(
        `SELECT s.id, s.user_id
         FROM students s
         WHERE s.id = $1`,
        [resolvedStudentId]
      );

      if (existingStudent.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Student not found" });
      }

      studentUserId = existingStudent.rows[0].user_id;

      if (req.file) {
        const fileUrl = `/uploads/${req.file.filename}`;
        await client.query(
          `UPDATE students
           SET cv_url = $1, updated_at = NOW()
           WHERE id = $2`,
          [fileUrl, resolvedStudentId]
        );
      }
    }

    const existingIntern = await client.query(
      `SELECT i.id
       FROM interns i
       JOIN projects p ON p.id = i.project_id
       WHERE i.student_id = $1 AND p.internship_id = $2
       LIMIT 1`,
      [resolvedStudentId, internshipId]
    );

    if (existingIntern.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Student already registered for this internship" });
    }

    const existingActiveAssignment = await client.query(
      `SELECT i.id, p.title
       FROM interns i
       JOIN projects p ON p.id = i.project_id
       WHERE i.student_id = $1 AND i.status IN ('active', 'paused')
       LIMIT 1`,
      [resolvedStudentId]
    );

    if (existingActiveAssignment.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Student already assigned to another active project",
        details: existingActiveAssignment.rows[0]
      });
    }

    const intern = await client.query(
      `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date, end_date)
       VALUES ($1, $2, $3, 'active', $4, $5)
       RETURNING id, student_id, project_id, start_date, end_date`,
      [resolvedStudentId, resolvedProjectId, supervisor.id, startDate || null, endDate || null]
    );

    if (startDate || endDate) {
      await client.query(
        `UPDATE internships
         SET start_date = COALESCE($1, start_date),
             end_date = COALESCE($2, end_date),
             duration_weeks = COALESCE($3, duration_weeks)
         WHERE id = $4`,
        [startDate || null, endDate || null, durationWeeks, internshipId]
      );
    }

    const tasks = await client.query(
      `SELECT title
       FROM tasks
       WHERE project_id = $1
       ORDER BY created_at`,
      [resolvedProjectId]
    );

    const studentUser = await client.query("SELECT id, email FROM users WHERE id = $1", [studentUserId]);

    await client.query(
      `INSERT INTO notifications (user_id, type, message, is_read)
       VALUES ($1, 'project_assignment', $2, false)`,
      [
        studentUser.rows[0].id,
        buildProjectNotificationText(
          internship.rows[0].title,
          internship.rows[0].description,
          tasks.rows.map((task) => task.title).filter(Boolean)
        )
      ]
    );

    if (shouldSendPasswordSetup) {
      passwordSetupToken = await issuePasswordResetToken(client, studentUser.rows[0].id);
    }

    await client.query("COMMIT");

    let warning = null;
    if (shouldSendPasswordSetup && passwordSetupToken) {
      try {
        await sendPasswordSetupMail(studentUser.rows[0].email, passwordSetupToken);
      } catch (mailError) {
        warning = "Password setup email failed to send";
      }
    }

    return res.status(201).json({
      ...intern.rows[0],
      warning
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

export const acceptStudent = async (req, res, next) => {
  try {
    const { internId, projectId } = req.body;
    if (!internId) {
      return res.status(400).json({ error: "internId required" });
    }

    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const intern = await query(
      `SELECT i.id, i.student_id, i.project_id, s.user_id
       FROM interns i
       JOIN students s ON s.id = i.student_id
       WHERE i.id = $1 AND i.supervisor_id = $2`,
      [internId, supervisor.id]
    );

    if (intern.rows.length === 0) {
      return res.status(404).json({ error: "Intern not found" });
    }

    let finalProjectId = intern.rows[0].project_id;
    if (projectId) {
      const project = await query(
        `SELECT id
         FROM projects
         WHERE id = $1 AND supervisor_id = $2`,
        [projectId, supervisor.id]
      );

      if (project.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      finalProjectId = projectId;
      await query("UPDATE interns SET project_id = $1 WHERE id = $2", [projectId, internId]);
    }

    const tasks = await query(
      `SELECT title
       FROM tasks
       WHERE project_id = $1
       ORDER BY created_at`,
      [finalProjectId]
    );

    const projectInfo = await query(
      `SELECT title, description
       FROM projects
       WHERE id = $1`,
      [finalProjectId]
    );

    await query(
      `INSERT INTO notifications (user_id, type, message, is_read)
       VALUES ($1, 'acceptance', $2, false)`,
      [
        intern.rows[0].user_id,
        buildProjectNotificationText(
          projectInfo.rows[0]?.title || "StageFlow Project",
          projectInfo.rows[0]?.description || null,
          tasks.rows.map((task) => task.title).filter(Boolean)
        )
      ]
    );

    return res.json({ success: true, message: "Student accepted" });
  } catch (error) {
    return next(error);
  }
};

export const deleteStudentFromInternship = async (req, res, next) => {
  try {
    const { internshipId, internId } = req.params;

    const supervisor = await getSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const deleted = await query(
      `DELETE FROM interns i
       USING projects p
       WHERE i.id = $1
         AND i.project_id = p.id
         AND p.internship_id = $2
         AND i.supervisor_id = $3
       RETURNING i.id`,
      [internId, internshipId, supervisor.id]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: "Intern not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

export const n8nCvParsedWebhook = async (req, res, next) => {
  try {
    const configuredSecret = process.env.N8N_WEBHOOK_SECRET;
    const incomingSecret = req.headers["x-webhook-token"];

    if (configuredSecret && incomingSecret !== configuredSecret) {
      return res.status(401).json({ error: "Invalid webhook token" });
    }

    const { studentId, email, cv_file_url: cvFileUrl, cvUrl } = req.body;
    if (!studentId && !email) {
      return res.status(400).json({ error: "studentId or email required" });
    }

    const resolvedUrl = cvFileUrl || cvUrl || null;
    if (!resolvedUrl) {
      return res.json({
        success: true,
        message: "CV parsing payload received. Simplified schema does not persist parsed metadata."
      });
    }

    let result;
    if (studentId) {
      result = await query(
        `UPDATE students
         SET cv_url = COALESCE($1, cv_url),
             updated_at = NOW()
         WHERE id = $2
         RETURNING id`,
        [resolvedUrl, studentId]
      );
    } else {
      result = await query(
        `UPDATE students s
         SET cv_url = COALESCE($1, s.cv_url),
             updated_at = NOW()
         FROM users u
         WHERE s.user_id = u.id
           AND lower(u.email) = lower($2)
         RETURNING s.id`,
        [resolvedUrl, email]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    return res.json({
      success: true,
      studentId: result.rows[0].id,
      message: "CV link updated. Simplified schema does not persist parsed metadata."
    });
  } catch (error) {
    return next(error);
  }
};
