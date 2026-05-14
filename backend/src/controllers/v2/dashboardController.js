import { query } from "../../config/db.js";

const formatTasks = (tasks) => ({
  total: Number(tasks.total || 0),
  todo: Number(tasks.todo || 0),
  inProgress: Number(tasks.in_progress || 0),
  done: Number(tasks.done || 0),
  progress: Number(tasks.total || 0) > 0 ? Math.round((Number(tasks.done || 0) / Number(tasks.total || 0)) * 100) : 0
});

export const getDashboard = async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      const [globalCounts, taskBreakdown, reportCounts, supervisorsByCompany] = await Promise.all([
        query(
          `SELECT
             (SELECT COUNT(*)::int FROM users) AS total_users,
             (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS total_students,
             (SELECT COUNT(*)::int FROM supervisors) AS total_supervisors,
             (SELECT COUNT(DISTINCT company_name)::int FROM supervisors) AS total_companies,
             (SELECT COUNT(*)::int FROM projects) AS total_projects,
             (SELECT COUNT(*)::int FROM interns) AS total_interns,
             (SELECT COUNT(*)::int FROM reports) AS total_reports`
        ),
        query(
          `SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE status = 'todo')::int AS todo,
             COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
             COUNT(*) FILTER (WHERE status = 'done')::int AS done
           FROM tasks`
        ),
        query(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
             COUNT(*) FILTER (WHERE status = 'validated')::int AS validated,
             COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
           FROM reports`
        ),
        query(
          `SELECT company_name, COUNT(*)::int AS supervisors_count
           FROM supervisors
           GROUP BY company_name
           ORDER BY company_name ASC`
        )
      ]);

      const totals = globalCounts.rows[0];

      return res.json({
        scope: "admin",
        summary: {
          students: totals.total_students,
          supervisors: totals.total_supervisors,
          companies: totals.total_companies,
          projects: totals.total_projects,
          interns: totals.total_interns,
          reports: totals.total_reports,
          totalUsers: totals.total_users,
          totalProjects: totals.total_projects,
          totalReports: totals.total_reports
        },
        tasks: formatTasks(taskBreakdown.rows[0]),
        reports: reportCounts.rows[0],
        supervisorsByCompany: supervisorsByCompany.rows
      });
    }

    if (req.user.role === "supervisor") {
      const supervisor = await query("SELECT id FROM supervisors WHERE user_id = $1", [req.user.id]);
      if (supervisor.rows.length === 0) {
        return res.status(404).json({ message: "Supervisor profile not found" });
      }

      const supervisorId = supervisor.rows[0].id;
      const [tasks, summary] = await Promise.all([
        query(
          `SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE t.status = 'todo')::int AS todo,
             COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
             COUNT(*) FILTER (WHERE t.status = 'done')::int AS done
           FROM tasks t
           JOIN projects p ON p.id = t.project_id
           WHERE p.supervisor_id = $1`,
          [supervisorId]
        ),
        query(
          `SELECT
             COUNT(DISTINCT inr.id)::int AS interns,
             COUNT(DISTINCT inr.id) FILTER (WHERE inr.status = 'active')::int AS active_interns,
             COUNT(DISTINCT inr.id) FILTER (WHERE inr.status = 'paused')::int AS paused_interns,
             COUNT(DISTINCT inr.id) FILTER (WHERE inr.status = 'completed')::int AS completed_interns,
             COUNT(DISTINCT inr.id) FILTER (WHERE inr.status = 'terminated')::int AS terminated_interns,
             COUNT(DISTINCT inr.student_id)::int AS students,
             COUNT(DISTINCT p.id)::int AS projects,
             COUNT(DISTINCT r.id)::int AS reports,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'submitted')::int AS pending_reports,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'validated')::int AS validated_reports,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'rejected')::int AS rejected_reports
           FROM supervisors s
           LEFT JOIN projects p ON p.supervisor_id = s.id
           LEFT JOIN interns inr ON inr.supervisor_id = s.id
           LEFT JOIN reports r ON r.project_id = p.id
           WHERE s.id = $1`,
          [supervisorId]
        )
      ]);

      const scopedSummary = summary.rows[0];

      return res.json({
        scope: "supervisor",
        summary: {
          students: scopedSummary.students,
          interns: scopedSummary.interns,
          activeInterns: scopedSummary.active_interns,
          projects: scopedSummary.projects,
          reports: scopedSummary.reports,
          pendingReports: scopedSummary.pending_reports
        },
        tasks: formatTasks(tasks.rows[0]),
        reports: {
          submitted: scopedSummary.pending_reports,
          validated: scopedSummary.validated_reports,
          rejected: scopedSummary.rejected_reports
        },
        interns: {
          active: scopedSummary.active_interns,
          paused: scopedSummary.paused_interns,
          completed: scopedSummary.completed_interns,
          terminated: scopedSummary.terminated_interns
        }
      });
    }

    if (req.user.role === "student") {
      const student = await query("SELECT id, profile_completed FROM students WHERE user_id = $1", [req.user.id]);
      if (student.rows.length === 0) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const studentId = student.rows[0].id;
      const [tasks, summary] = await Promise.all([
        query(
          `SELECT
             COUNT(DISTINCT t.id)::int AS total,
             COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'todo')::int AS todo,
             COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
             COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done')::int AS done
           FROM interns inr
           JOIN projects p ON p.id = inr.project_id
           LEFT JOIN tasks t ON t.project_id = p.id
           WHERE inr.student_id = $1`,
          [studentId]
        ),
        query(
          `SELECT
             COUNT(DISTINCT inr.id)::int AS interns,
             COUNT(DISTINCT inr.id) FILTER (WHERE inr.status = 'active')::int AS active_placements,
             COUNT(DISTINCT p.id)::int AS projects,
             COUNT(DISTINCT r.id)::int AS reports,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'draft')::int AS draft_reports,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'submitted')::int AS submitted_reports,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'validated')::int AS validated_reports,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'rejected')::int AS rejected_reports
           FROM interns inr
           LEFT JOIN projects p ON p.id = inr.project_id
           LEFT JOIN reports r ON r.intern_id = inr.id
           WHERE inr.student_id = $1`,
          [studentId]
        )
      ]);

      const scopedSummary = summary.rows[0];

      return res.json({
        scope: "student",
        summary: {
          interns: scopedSummary.interns,
          activePlacements: scopedSummary.active_placements,
          projects: scopedSummary.projects,
          reports: scopedSummary.reports,
          profileCompleted: Boolean(student.rows[0].profile_completed)
        },
        tasks: formatTasks(tasks.rows[0]),
        reports: {
          draft: scopedSummary.draft_reports,
          submitted: scopedSummary.submitted_reports,
          validated: scopedSummary.validated_reports,
          rejected: scopedSummary.rejected_reports
        }
      });
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (error) {
    return next(error);
  }
};
