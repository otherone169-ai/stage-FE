import { query } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const applyToInternship = async (req, res, next) => {
  try {
    const { internshipId } = req.body;

    const studentResult = await query(
      "SELECT id, full_name, profile_completed FROM students WHERE user_id = $1",
      [req.user.id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const student = studentResult.rows[0];

    if (!student.profile_completed) {
      return res.status(400).json({
        message: "Complete your profile before applying"
      });
    }

    const internshipResult = await query(
      "SELECT id, company_id, title FROM internships WHERE id = $1 AND is_active = true AND moderation_status = 'approved'",
      [internshipId]
    );

    if (internshipResult.rows.length === 0) {
      return res.status(404).json({ message: "Internship not found" });
    }

    const internship = internshipResult.rows[0];

    const exists = await query(
      "SELECT id FROM applications WHERE student_id = $1 AND internship_id = $2",
      [student.id, internshipId]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Already applied" });
    }

    const result = await query(
      `INSERT INTO applications (student_id, internship_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [student.id, internshipId]
    );

    await logAudit(req.user.id, "APPLICATION_SUBMITTED", { internshipId });
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
};

export const listApplicants = async (req, res, next) => {
  try {
    const internshipId = req.params.internshipId;

    const ownership = await query(
      `SELECT i.id
       FROM internships i
       JOIN companies c ON c.id = i.company_id
       WHERE i.id = $1 AND c.user_id = $2`,
      [internshipId, req.user.id]
    );

    if (ownership.rows.length === 0) {
      return res.status(403).json({ message: "Internship does not belong to your company" });
    }

    const values = [internshipId];
    const where = ["a.internship_id = $1"];

    if (req.query.skills) {
      values.push(req.query.skills);
      where.push(`LOWER(s.skills) LIKE LOWER('%' || $${values.length} || '%')`);
    }

    if (req.query.experience) {
      values.push(req.query.experience);
      where.push(`LOWER(s.experience) LIKE LOWER('%' || $${values.length} || '%')`);
    }

    const result = await query(
      `SELECT a.id AS application_id, a.status, a.applied_at,
              s.id AS student_id, s.full_name, s.skills, s.experience, s.cv_url
       FROM applications a
       JOIN students s ON s.id = a.student_id
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
  try {
    const applicationId = req.params.applicationId;
    const { status, supervisorId } = req.body;

    const appResult = await query(
      `SELECT a.id, a.student_id, a.internship_id, i.company_id, i.title
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE a.id = $1 AND c.user_id = $2`,
      [applicationId, req.user.id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const app = appResult.rows[0];

    let acceptedInternId = null;
    let projectId = null;
    let assignedSupervisorId = null;

    if (status === "accepted" && supervisorId) {
      const supervisorOwnership = await query(
        `SELECT s.id
         FROM supervisors s
         JOIN companies c ON c.id = s.company_id
         WHERE s.id = $1 AND c.user_id = $2`,
        [supervisorId, req.user.id]
      );

      if (supervisorOwnership.rows.length === 0) {
        return res.status(400).json({ message: "Supervisor not found in your company" });
      }

      assignedSupervisorId = supervisorId;
    }

    await query("UPDATE applications SET status = $1 WHERE id = $2", [status, applicationId]);

    if (status === "accepted") {
      await query(
        "UPDATE applications SET status = 'rejected' WHERE internship_id = $1 AND id <> $2 AND status = 'pending'",
        [app.internship_id, applicationId]
      );

      let projectResult = await query(
        "SELECT id FROM projects WHERE internship_id = $1 ORDER BY created_at DESC LIMIT 1",
        [app.internship_id]
      );

      if (projectResult.rows.length === 0) {
        projectResult = await query(
          `INSERT INTO projects (internship_id, title, description, objectives)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [
            app.internship_id,
            `Project for ${app.title}`,
            "Auto-created after application acceptance",
            "Onboard and execute internship objectives"
          ]
        );
      }

      projectId = projectResult.rows[0].id;

      if (assignedSupervisorId) {
        await query("UPDATE projects SET supervisor_id = $1 WHERE id = $2", [assignedSupervisorId, projectId]);
      }

      const internResult = await query(
        `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date)
         VALUES ($1, $2, $3, 'active', CURRENT_DATE)
         ON CONFLICT (student_id, project_id)
         DO UPDATE SET supervisor_id = COALESCE(EXCLUDED.supervisor_id, interns.supervisor_id)
         RETURNING id`,
        [app.student_id, projectId, assignedSupervisorId]
      );

      acceptedInternId = internResult.rows[0]?.id || null;

      if (acceptedInternId && assignedSupervisorId) {
        await query("UPDATE interns SET supervisor_id = $1 WHERE id = $2", [assignedSupervisorId, acceptedInternId]);
      }

      await query("UPDATE internships SET is_active = false WHERE id = $1", [app.internship_id]);
    }

    await logAudit(req.user.id, "APPLICATION_REVIEWED", { applicationId, status });
    return res.json({
      message: `Application ${status}`,
      status,
      internId: acceptedInternId,
      projectId,
      assignedSupervisorId
    });
  } catch (error) {
    return next(error);
  }
};

export const assignSupervisor = async (req, res, next) => {
  try {
    const internId = req.params.internId;
    const { supervisorId } = req.body;

    const ownership = await query(
      `SELECT inr.id, p.id AS project_id
       FROM interns inr
       JOIN projects p ON p.id = inr.project_id
       JOIN internships i ON i.id = p.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE inr.id = $1 AND c.user_id = $2`,
      [internId, req.user.id]
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({ message: "Intern record not found" });
    }

    const supervisor = await query(
      `SELECT s.id
       FROM supervisors s
       JOIN companies c ON c.id = s.company_id
       WHERE s.id = $1 AND c.user_id = $2`,
      [supervisorId, req.user.id]
    );

    if (supervisor.rows.length === 0) {
      return res.status(404).json({ message: "Supervisor not found in your company" });
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
