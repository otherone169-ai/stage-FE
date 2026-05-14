import { query } from "../../config/db.js";

export const getSupervisorDashboardStats = async (req, res, next) => {
  try {
    const { id: userId } = req.user;

    const supervisor = await query(`SELECT id FROM supervisors WHERE user_id = $1`, [userId]);

    if (!supervisor.rows.length) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const supervisorId = supervisor.rows[0].id;

    const studentStats = await query(
      `SELECT
        COUNT(DISTINCT i.id)::int AS total,
        COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END)::int AS active,
        COUNT(DISTINCT CASE WHEN i.status = 'paused' THEN i.id END)::int AS paused,
        COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END)::int AS completed
       FROM interns i
       WHERE i.supervisor_id = $1`,
      [supervisorId]
    );

    const projectStats = await query(
      `SELECT
        p.id, p.title, COUNT(DISTINCT i.id)::int AS student_count
       FROM projects p
       LEFT JOIN interns i ON p.id = i.project_id
       WHERE p.supervisor_id = $1
       GROUP BY p.id`,
      [supervisorId]
    );

    const projectsWithProgress = await query(
      `SELECT
        p.id,
        p.title,
        MIN(ins.start_date) AS start_date,
        MAX(ins.end_date) AS end_date,
        COUNT(DISTINCT ins.id)::int AS total_students,
        COUNT(DISTINCT CASE WHEN ins.status = 'active' THEN ins.id END)::int AS active_students
       FROM projects p
       LEFT JOIN interns ins ON ins.project_id = p.id
       WHERE p.supervisor_id = $1
       GROUP BY p.id, p.title
       ORDER BY p.created_at DESC`,
      [supervisorId]
    );

    const projectsWithProgressData = projectsWithProgress.rows.map((proj) => {
      let progressPercent = 0;
      if (proj.start_date && proj.end_date) {
        const now = new Date();
        const start = new Date(proj.start_date);
        const end = new Date(proj.end_date);
        const totalMs = end - start;
        const elapsedMs = now - start;
        progressPercent = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;
      }
      return {
        ...proj,
        progressPercent: Math.round(progressPercent),
        daysRemaining: proj.end_date
          ? Math.ceil((new Date(proj.end_date) - new Date()) / (24 * 60 * 60 * 1000))
          : null
      };
    });

    res.json({
      studentStats: studentStats.rows[0],
      projectStats: projectStats.rows,
      projects: projectsWithProgressData
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboardStats = async (req, res, next) => {
  try {
    const { id: userId } = req.user;

    const student = await query(`SELECT s.id FROM students s WHERE s.user_id = $1`, [userId]);

    if (!student.rows.length) {
      return res.status(403).json({ error: "Not authorized as student" });
    }

    const placementStats = await query(
      `SELECT
        i.id,
        i.status,
        i.start_date,
        i.end_date,
        p.title AS project_title,
        su.full_name AS supervisor_name,
        su.company_name AS company_name
       FROM interns i
       JOIN projects p ON i.project_id = p.id
       JOIN supervisors su ON i.supervisor_id = su.id
       WHERE i.student_id = $1
       ORDER BY i.created_at DESC`,
      [student.rows[0].id]
    );

    const projectsWithProgress = placementStats.rows.map((row) => {
      let progressPercent = 0;
      let daysRemaining = null;
      if (row.start_date && row.end_date) {
        const now = new Date();
        const start = new Date(row.start_date);
        const end = new Date(row.end_date);
        const totalMs = end - start;
        const elapsedMs = now - start;
        progressPercent = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;
        daysRemaining = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
      }
      return {
        ...row,
        progressPercent: Math.round(progressPercent),
        daysRemaining
      };
    });

    const taskStats = await query(
      `SELECT
        COUNT(DISTINCT t.id)::int AS total,
        COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END)::int AS todo,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END)::int AS in_progress,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int AS done
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN interns i ON p.id = i.project_id
       WHERE i.student_id = $1`,
      [student.rows[0].id]
    );

    res.json({
      projects: projectsWithProgress,
      taskStats: taskStats.rows[0] || { total: 0, todo: 0, in_progress: 0, done: 0 }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const { role } = req.user;

    if (role !== "admin") {
      return res.status(403).json({ error: "Not authorized as admin" });
    }

    const globalStats = await query(
      `SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS total_students,
        (SELECT COUNT(*)::int FROM users WHERE role = 'supervisor') AS total_supervisors,
        (SELECT COUNT(*)::int FROM interns) AS total_interns,
        (SELECT COUNT(DISTINCT company_name)::int FROM supervisors) AS total_companies,
        (SELECT COUNT(*)::int FROM projects) AS total_projects`
    );

    const supervisorStats = await query(
      `SELECT
        su.id, su.full_name, su.position,
        su.company_name,
        COUNT(DISTINCT i.id)::int AS managed_students,
        COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END)::int AS active_students,
        COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END)::int AS completed_students
       FROM supervisors su
       LEFT JOIN interns i ON su.id = i.supervisor_id
       GROUP BY su.id, su.full_name, su.position, su.company_name
       ORDER BY managed_students DESC`
    );

    const topProjects = await query(
      `SELECT
        p.id, p.title, COUNT(DISTINCT i.id)::int AS student_count
       FROM projects p
       LEFT JOIN interns i ON p.id = i.project_id
       GROUP BY p.id
       ORDER BY student_count DESC
       LIMIT 10`
    );

    res.json({
      globalStats: globalStats.rows[0],
      supervisorStats: supervisorStats.rows,
      topProjects: topProjects.rows
    });
  } catch (error) {
    next(error);
  }
};
