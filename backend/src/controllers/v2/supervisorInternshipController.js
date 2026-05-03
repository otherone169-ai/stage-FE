import crypto from "crypto";
import bcrypt from "bcryptjs";
import pool, { query } from "../../config/db.js";
import { sendMail } from "../../utils/mailer.js";

const toSafeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const computeDurationWeeks = (startDate, endDate) => {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;

  return Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
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
    subject: "Definir votre mot de passe - StageFlow",
    text: `Votre compte stagiaire est pret. Definissez votre mot de passe ici: ${resetUrl}`,
    html: `<p>Votre compte stagiaire est pret.</p><p>Cliquez ici pour definir votre mot de passe:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ce lien expire dans 30 minutes.</p>`
  });
};

const buildProjectNotificationText = (projectTitle, projectDescription, taskTitles) => {
  const taskSection = taskTitles.length > 0 ? taskTitles.map((task) => `- ${task}`).join("\n") : "- Aucune tache encore associee";

  return [
    `Votre projet StageFlow est pret: ${projectTitle}`,
    projectDescription ? `Description: ${projectDescription}` : null,
    "Taches associees:",
    taskSection
  ]
    .filter(Boolean)
    .join("\n\n");
};

const buildProjectNotificationHtml = (projectTitle, projectDescription, taskTitles) => {
  const tasksMarkup =
    taskTitles.length > 0
      ? `<ul>${taskTitles.map((task) => `<li>${task}</li>`).join("")}</ul>`
      : "<p>Aucune tache encore associee.</p>";

  return `
    <p>Votre projet StageFlow est pret: <strong>${projectTitle}</strong></p>
    ${projectDescription ? `<p><strong>Description:</strong> ${projectDescription}</p>` : ""}
    <p><strong>Taches associees:</strong></p>
    ${tasksMarkup}
  `;
};

// Get internships for a supervisor
export const getSupervisorInternships = async (req, res, next) => {
  try {
    const { id: supervisorId } = req.user;
    const supervisor = await query(
      `SELECT id FROM supervisors WHERE user_id = $1`,
      [supervisorId]
    );

    if (!supervisor.rows.length) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const internships = await query(
      `SELECT 
        i.id, i.title, i.description, i.location, 
        i.domain, i.start_date, i.end_date, i.duration_weeks,
        i.moderation_status, i.is_active, i.created_at
       FROM internships i
       WHERE i.supervisor_id = $1
       ORDER BY i.created_at DESC`,
      [supervisor.rows[0].id]
    );

    res.json(internships.rows);
  } catch (error) {
    next(error);
  }
};

// Create internship for supervisor
export const createInternshipForSupervisor = async (req, res, next) => {
  try {
    const { id: supervisorId } = req.user;
    const { title, description, location, domain, startDate, endDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    const supervisor = await query(
      `SELECT id, company_id FROM supervisors WHERE user_id = $1`,
      [supervisorId]
    );

    if (!supervisor.rows.length) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const durationWeeks = computeDurationWeeks(startDate, endDate);
    if (startDate && endDate && !durationWeeks) {
      return res.status(400).json({ error: "Invalid dates. endDate must be after startDate" });
    }

    const internship = await query(
      `INSERT INTO internships 
        (company_id, supervisor_id, title, description, location, domain, start_date, end_date, duration_weeks, moderation_status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', true)
       RETURNING id, title, description, location, domain, start_date, end_date, duration_weeks, created_at`,
      [
        supervisor.rows[0].company_id,
        supervisor.rows[0].id,
        title,
        description,
        location || null,
        domain || null,
        startDate || null,
        endDate || null,
        durationWeeks
      ]
    );

    res.status(201).json(internship.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Get students for supervisor's internship/project
export const getSupervisorStudents = async (req, res, next) => {
  try {
    const { id: supervisorId } = req.user;
    const { internshipId } = req.params;

    const supervisor = await query(
      `SELECT id FROM supervisors WHERE user_id = $1`,
      [supervisorId]
    );

    if (!supervisor.rows.length) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    // Verify internship belongs to supervisor
    const internship = await query(
      `SELECT id FROM internships WHERE id = $1 AND supervisor_id = $2`,
      [internshipId, supervisor.rows[0].id]
    );

    if (!internship.rows.length) {
      return res.status(404).json({ error: "Internship not found" });
    }

    const students = await query(
      `SELECT 
        i.id, s.id as student_id, s.full_name, u.email, s.cv_url, s.cv_file_url, s.cv_parsed_data,
        i.acceptance_status, i.start_date, i.end_date, i.created_at
       FROM interns i
       JOIN students s ON i.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE i.project_id IN (SELECT id FROM projects WHERE internship_id = $1)
       ORDER BY i.created_at DESC`,
      [internshipId]
    );

    res.json(students.rows);
  } catch (error) {
    next(error);
  }
};

// Add student to internship/project
export const addStudentToInternship = async (req, res, next) => {
  try {
    const { id: supervisorId } = req.user;
    const internshipId = req.params.internshipId || req.body.internshipId;
    const {
      studentId,
      fullName,
      email,
      phone,
      education,
      skills,
      experience,
      startDate,
      endDate
    } = req.body;

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const resolvedFullName = typeof fullName === "string" && fullName.trim()
      ? fullName.trim()
      : normalizedEmail.split("@")[0] || "Stagiaire";

    if (!internshipId) {
      return res.status(400).json({ error: "internshipId required" });
    }

    if (!studentId && !normalizedEmail) {
      return res.status(400).json({ error: "Provide studentId or email" });
    }

    const supervisor = await query(
      `SELECT id FROM supervisors WHERE user_id = $1`,
      [supervisorId]
    );

    if (!supervisor.rows.length) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const internship = await query(
      `SELECT id FROM internships WHERE id = $1 AND supervisor_id = $2`,
      [internshipId, supervisor.rows[0].id]
    );

    if (!internship.rows.length) {
      return res.status(404).json({ error: "Internship not found" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create project if not exists
      let project = await client.query(
        `SELECT id FROM projects WHERE internship_id = $1 LIMIT 1`,
        [internshipId]
      );

      if (!project.rows.length) {
        project = await client.query(
          `INSERT INTO projects (internship_id, supervisor_id, title, description)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [internshipId, supervisor.rows[0].id, "Default Project", ""]
        );
      }

      let resolvedStudentId = toSafeNumber(studentId) || studentId || null;
      let studentUserId = null;
      let inviteToken = null;

      if (!resolvedStudentId) {
        const existingUser = await client.query(
          `SELECT id, role FROM users WHERE email = $1`,
          [normalizedEmail]
        );

        if (existingUser.rows.length && existingUser.rows[0].role !== "student") {
          await client.query("ROLLBACK");
          return res.status(409).json({ error: "Email already used by non-student account" });
        }

        if (!existingUser.rows.length) {
          const randomPassword = Math.random().toString(36).slice(-12);
          const passwordHash = await bcrypt.hash(randomPassword, 10);
          const userInsert = await client.query(
            `INSERT INTO users (email, password_hash, role, is_active, is_email_verified)
             VALUES ($1, $2, 'student', true, true)
             RETURNING id`,
            [normalizedEmail, passwordHash]
          );
          studentUserId = userInsert.rows[0].id;
        } else {
          studentUserId = existingUser.rows[0].id;
        }

        const existingStudent = await client.query(
          `SELECT id FROM students WHERE user_id = $1`,
          [studentUserId]
        );

        if (existingStudent.rows.length) {
          resolvedStudentId = existingStudent.rows[0].id;
          if (req.file) {
            const cvUrl = `/uploads/${req.file.filename}`;
            await client.query(
              `UPDATE students
               SET cv_url = COALESCE($1, cv_url),
                   updated_at = NOW()
               WHERE id = $2`,
              [cvUrl, resolvedStudentId]
            );
          }
        } else {
          const skillsCsv = Array.isArray(skills)
            ? skills.join(",")
            : typeof skills === "string"
              ? skills
              : "";
          const cvUrl = req.file ? `/uploads/${req.file.filename}` : null;
          const studentInsert = await client.query(
            `INSERT INTO students (user_id, full_name, phone, education, skills, experience, cv_url, profile_completed)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
              studentUserId,
              resolvedFullName,
              phone || null,
              education || null,
              skillsCsv,
              experience || null,
              cvUrl,
              Boolean(resolvedFullName && normalizedEmail && cvUrl)
            ]
          );
          resolvedStudentId = studentInsert.rows[0].id;
        }
      }

      if (!resolvedStudentId) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Unable to resolve student" });
      }

      const inviteRecipient = await client.query("SELECT email FROM users WHERE id = $1", [studentUserId]);
      const inviteEmail = inviteRecipient.rows[0]?.email || normalizedEmail;

      if (inviteEmail) {
        inviteToken = await issuePasswordResetToken(client, studentUserId);
      }

      const internDurationWeeks = computeDurationWeeks(startDate, endDate);

      // Add student as intern
      const intern = await client.query(
        `INSERT INTO interns (student_id, project_id, supervisor_id, status, acceptance_status, start_date, end_date)
         VALUES ($1, $2, $3, 'active', 'pending', $4, $5)
         RETURNING id, student_id, project_id, start_date, end_date`,
        [resolvedStudentId, project.rows[0].id, supervisor.rows[0].id, startDate || null, endDate || null]
      );

      if (startDate || endDate) {
        await client.query(
          `UPDATE internships
           SET start_date = COALESCE($1, start_date),
               end_date = COALESCE($2, end_date),
               duration_weeks = COALESCE($3, duration_weeks)
           WHERE id = $4`,
          [startDate || null, endDate || null, internDurationWeeks, internshipId]
        );
      }

      await client.query("COMMIT");
      if (inviteToken && inviteEmail) {
        try {
          await sendPasswordSetupMail(inviteEmail, inviteToken);
        } catch (mailError) {
          // Keep the student creation successful even if SMTP is temporarily unavailable.
        }
      }
      res.status(201).json(intern.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// Accept student (supervisor side)
export const acceptStudent = async (req, res, next) => {
  try {
    const { id: supervisorId } = req.user;
    const { internId, projectId, message } = req.body;

    if (!internId || !projectId) {
      return res.status(400).json({ error: "internId and projectId required" });
    }

    const supervisor = await query(
      `SELECT id FROM supervisors WHERE user_id = $1`,
      [supervisorId]
    );

    if (!supervisor.rows.length) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get intern details
      const intern = await client.query(
        `SELECT i.id, i.student_id, i.project_id, p.internship_id
         FROM interns i
         JOIN projects p ON p.id = i.project_id
         WHERE i.id = $1 AND i.supervisor_id = $2`,
        [internId, supervisor.rows[0].id]
      );

      if (!intern.rows.length) {
        throw new Error("Intern not found");
      }

      const student = await client.query(
        `SELECT s.user_id, s.full_name, u.email FROM students s
         JOIN users u ON u.id = s.user_id
         WHERE s.id = $1`,
        [intern.rows[0].student_id]
      );

      if (!student.rows.length) {
        throw new Error("Student not found");
      }

      const project = await client.query(
        `SELECT p.title, p.description, i.title AS internship_title
         FROM projects p
         JOIN internships i ON i.id = p.internship_id
         WHERE p.id = $1 AND p.supervisor_id = $2`,
        [projectId, supervisor.rows[0].id]
      );

      if (!project.rows.length) {
        throw new Error("Project not found");
      }

      if (intern.rows[0].internship_id !== project.rows[0].internship_id) {
        throw new Error("Project does not belong to the same internship");
      }

      const tasks = await client.query(
        `SELECT title
         FROM tasks
         WHERE project_id = $1
         ORDER BY created_at ASC`,
        [projectId]
      );

      await client.query(
        `UPDATE interns SET project_id = $1, project_assigned_at = NOW(), acceptance_status = 'accepted', acceptance_date = NOW()
         WHERE id = $2`,
        [projectId, internId]
      );

      const taskTitles = tasks.rows.map((task) => task.title).filter(Boolean);
      const notificationMessage = buildProjectNotificationText(
        project.rows[0].title,
        project.rows[0]?.description || "",
        taskTitles
      );

      // Create acceptance workflow record
      await client.query(
        `INSERT INTO acceptance_workflows 
          (student_id, supervisor_id, project_id, status, project_title, supervisor_message, email_sent_at)
         VALUES ($1, $2, $3, 'accepted', $4, $5, NOW())`,
        [intern.rows[0].student_id, supervisor.rows[0].id, projectId, project.rows[0].title, message]
      );

      // Create notification
      await client.query(
        `INSERT INTO notifications (user_id, type, message)
         VALUES ($1, 'acceptance', $2)`,
        [
          student.rows[0].user_id,
          `${project.rows[0]?.internship_title || "Projet StageFlow"}\n${notificationMessage}`
        ]
      );

      await client.query("COMMIT");
      try {
        await sendMail({
          to: student.rows[0].email,
          subject: `Votre projet StageFlow: ${project.rows[0].title}`,
          text: buildProjectNotificationText(project.rows[0].title, project.rows[0]?.description || "", taskTitles),
          html: buildProjectNotificationHtml(project.rows[0].title, project.rows[0]?.description || "", taskTitles)
        });
      } catch (mailError) {
        // Notification inserted in-app; email delivery failure should not block acceptance.
      }

      res.json({ success: true, message: "Student accepted" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

export const deleteStudentFromInternship = async (req, res, next) => {
  try {
    const { id: supervisorUserId } = req.user;
    const { internshipId, internId } = req.params;

    const supervisor = await query(`SELECT id FROM supervisors WHERE user_id = $1`, [supervisorUserId]);
    if (!supervisor.rows.length) {
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
      [internId, internshipId, supervisor.rows[0].id]
    );

    if (!deleted.rows.length) {
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

    const { studentId, email, cvParsedData, cv_file_url: cvFileUrl, cvUrl } = req.body;

    if (!studentId && !email) {
      return res.status(400).json({ error: "studentId or email required" });
    }

    let result;
    if (studentId) {
      result = await query(
        `UPDATE students
         SET cv_parsed_data = $1,
             cv_file_url = COALESCE($2, cv_file_url),
             updated_at = NOW()
         WHERE id = $3
         RETURNING id`,
        [cvParsedData || null, cvFileUrl || cvUrl || null, studentId]
      );
    } else {
      result = await query(
        `UPDATE students s
         SET cv_parsed_data = $1,
             cv_file_url = COALESCE($2, s.cv_file_url),
             updated_at = NOW()
         FROM users u
         WHERE s.user_id = u.id
           AND lower(u.email) = lower($3)
         RETURNING s.id`,
        [cvParsedData || null, cvFileUrl || cvUrl || null, email]
      );
    }

    if (!result.rows.length) {
      return res.status(404).json({ error: "Student not found" });
    }

    return res.json({ success: true, studentId: result.rows[0].id });
  } catch (error) {
    return next(error);
  }
};
