import pool, { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

const resolveSupervisor = async (userId) => {
  const supervisor = await query(
    "SELECT id, company_name, full_name FROM supervisors WHERE user_id = $1",
    [userId]
  );

  return supervisor.rows[0] || null;
};

const buildProjectTitle = (internshipTitle, studentName) =>
  `${internshipTitle}${studentName ? ` - ${studentName}` : ""}`.slice(0, 180);

export const applyToInternship = async (req, res, next) => {
  try {
    const { internshipId, coverLetter } = req.body;

    const studentResult = await query(
      "SELECT id, profile_completed FROM students WHERE user_id = $1",
      [req.user.id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const student = studentResult.rows[0];
    if (!student.profile_completed) {
      return res.status(400).json({ message: "Complete your profile before applying" });
    }

    const internshipResult = await query(
      `SELECT id
       FROM internships
       WHERE id = $1 AND is_active = true AND moderation_status = 'approved'`,
      [internshipId]
    );

    if (internshipResult.rows.length === 0) {
      return res.status(404).json({ message: "Internship not found" });
    }

    const exists = await query(
      "SELECT id FROM applications WHERE student_id = $1 AND internship_id = $2",
      [student.id, internshipId]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Already applied" });
    }

    const result = await query(
      `INSERT INTO applications (student_id, internship_id, status, cover_letter)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [student.id, internshipId, coverLetter?.trim() || null]
    );

    await logAudit(req.user.id, "APPLICATION_SUBMITTED", { internshipId });
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const listApplicants = async (req, res, next) => {
  try {
    const supervisor = await resolveSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const internshipId = req.params.internshipId;
    const ownership = await query(
      `SELECT id
       FROM internships
       WHERE id = $1 AND supervisor_id = $2`,
      [internshipId, supervisor.id]
    );

    if (ownership.rows.length === 0) {
      return res.status(403).json({ message: "Internship does not belong to you" });
    }

    const values = [internshipId];
    const where = ["a.internship_id = $1"];

    if (req.query.skills) {
      values.push(req.query.skills);
      where.push(`LOWER(COALESCE(s.skills, '')) LIKE LOWER('%' || $${values.length} || '%')`);
    }

    if (req.query.experience) {
      values.push(req.query.experience);
      where.push(`LOWER(COALESCE(s.experience, '')) LIKE LOWER('%' || $${values.length} || '%')`);
    }

    const result = await query(
      `SELECT
         a.id AS application_id,
         a.status,
         a.cover_letter,
         a.applied_at,
         a.reviewed_at,
         a.reviewer_notes,
         s.id AS student_id,
         s.full_name,
         s.skills,
         s.experience,
         s.cv_url,
         u.email AS student_email
       FROM applications a
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       WHERE ${where.join(" AND ")}
       ORDER BY a.applied_at DESC`,
      values
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const reviewApplication = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const supervisor = await resolveSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const applicationId = req.params.applicationId;
    const { status, reviewerNotes, projectId, projectTitle, projectDescription, startDate, endDate } = req.body;

    await client.query("BEGIN");

    const appResult = await client.query(
      `SELECT
         a.id,
         a.student_id,
         a.internship_id,
         a.status AS current_status,
         i.title AS internship_title,
         i.description AS internship_description,
         i.location,
         i.domain,
         i.start_date,
         i.end_date,
         i.duration_weeks,
         i.supervisor_id,
         s.full_name AS student_name
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN students s ON s.id = a.student_id
       WHERE a.id = $1 AND i.supervisor_id = $2
       FOR UPDATE`,
      [applicationId, supervisor.id]
    );

    if (appResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Application not found" });
    }

    const application = appResult.rows[0];

    if (application.current_status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Only pending applications can be reviewed" });
    }

    const updatedApplication = await client.query(
      `UPDATE applications
       SET status = $1,
           reviewed_at = NOW(),
           reviewed_by_supervisor_id = $2,
           reviewer_notes = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, supervisor.id, reviewerNotes?.trim() || null, applicationId]
    );

    let createdProjectId = null;
    let createdInternId = null;

    if (status === "accepted") {
      const targetProjectId = projectId || null;
      let resolvedProjectId = null;

      if (targetProjectId) {
        const project = await client.query(
          `SELECT id
           FROM projects
           WHERE id = $1 AND internship_id = $2 AND supervisor_id = $3`,
          [targetProjectId, application.internship_id, supervisor.id]
        );

        if (project.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "Project not found for this internship" });
        }

        resolvedProjectId = project.rows[0].id;
      } else {
        const latestProject = await client.query(
          `SELECT id
           FROM projects
           WHERE internship_id = $1 AND supervisor_id = $2
           ORDER BY created_at DESC
           LIMIT 1`,
          [application.internship_id, supervisor.id]
        );

        if (latestProject.rows.length > 0) {
          resolvedProjectId = latestProject.rows[0].id;
        } else {
          const newProject = await client.query(
            `INSERT INTO projects
               (internship_id, supervisor_id, title, description, objectives, location, duration, domain)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
              application.internship_id,
              supervisor.id,
              (projectTitle?.trim() || buildProjectTitle(application.internship_title, application.student_name)),
              projectDescription?.trim() || application.internship_description || null,
              application.internship_description || null,
              application.location || null,
              application.duration_weeks ? `${application.duration_weeks} weeks` : null,
              application.domain || null
            ]
          );

          resolvedProjectId = newProject.rows[0].id;
        }
      }

      const existingIntern = await client.query(
        `SELECT id
         FROM interns
         WHERE student_id = $1 AND project_id = $2`,
        [application.student_id, resolvedProjectId]
      );

      if (existingIntern.rows.length === 0) {
        const intern = await client.query(
          `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date, end_date)
           VALUES ($1, $2, $3, 'active', $4, $5)
           RETURNING id`,
          [
            application.student_id,
            resolvedProjectId,
            supervisor.id,
            startDate || application.start_date || null,
            endDate || application.end_date || null
          ]
        );

        createdInternId = intern.rows[0].id;
      } else {
        createdInternId = existingIntern.rows[0].id;
      }

      createdProjectId = resolvedProjectId;

      await client.query(
        `UPDATE applications
         SET status = 'rejected',
             reviewed_at = NOW(),
             reviewed_by_supervisor_id = $1,
             reviewer_notes = COALESCE(reviewer_notes, 'Rejected after another application was accepted'),
             updated_at = NOW()
         WHERE internship_id = $2
           AND id <> $3
           AND status = 'pending'`,
        [supervisor.id, application.internship_id, applicationId]
      );

      await client.query("UPDATE internships SET is_active = false WHERE id = $1", [application.internship_id]);
    }

    await client.query("COMMIT");

    await logAudit(req.user.id, "APPLICATION_REVIEWED", {
      applicationId,
      status,
      projectId: createdProjectId,
      internId: createdInternId
    });

    return res.json({
      message: `Application ${status}`,
      application: updatedApplication.rows[0],
      projectId: createdProjectId,
      internId: createdInternId
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

export const assignSupervisor = async (req, res, next) => {
  try {
    const supervisor = await resolveSupervisor(req.user.id);
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found" });
    }

    const internId = req.params.internId;
    const { supervisorId } = req.body;

    const ownership = await query(
      `SELECT inr.id, inr.project_id
       FROM interns inr
       JOIN projects p ON p.id = inr.project_id
       WHERE inr.id = $1 AND p.supervisor_id = $2`,
      [internId, supervisor.id]
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({ message: "Intern record not found" });
    }

    const targetSupervisor = await query(
      `SELECT id, company_name
       FROM supervisors
       WHERE id = $1`,
      [supervisorId]
    );

    if (targetSupervisor.rows.length === 0) {
      return res.status(404).json({ message: "Target supervisor not found" });
    }

    if (targetSupervisor.rows[0].company_name !== supervisor.company_name) {
      return res.status(400).json({ message: "Supervisors must belong to the same company" });
    }

    await query("UPDATE interns SET supervisor_id = $1 WHERE id = $2", [supervisorId, internId]);
    await query("UPDATE projects SET supervisor_id = $1 WHERE id = $2", [
      supervisorId,
      ownership.rows[0].project_id
    ]);

    await logAudit(req.user.id, "SUPERVISOR_ASSIGNED", { internId, supervisorId });
    return res.json({ message: "Supervisor assigned successfully" });
  } catch (error) {
    return next(error);
  }
};
