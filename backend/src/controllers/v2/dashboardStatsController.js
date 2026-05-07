import { query } from "../../config/db.js";

// Get dashboard stats for supervisor
export const getSupervisorDashboardStats = async (req, res, next) => {
  try {
    const { id: userId } = req.user;

    const supervisor = await query(
      `SELECT id FROM supervisors WHERE user_id = $1`,
      [userId]
    );

    if (!supervisor.rows.length) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const supervisorId = supervisor.rows[0].id;

    // Total students stats
    const studentStats = await query(
      `SELECT 
        COUNT(DISTINCT i.id)::int as total,
        COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END)::int as active,
        COUNT(DISTINCT CASE WHEN i.status = 'paused' THEN i.id END)::int as paused,
        COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END)::int as completed
       FROM interns i
       WHERE i.supervisor_id = $1`,
      [supervisorId]
    );

    // Projects stats
    const projectStats = await query(
      `SELECT 
        p.id, p.title, COUNT(DISTINCT i.id)::int as student_count
       FROM projects p
       LEFT JOIN interns i ON p.id = i.project_id
       WHERE p.supervisor_id = $1
       GROUP BY p.id`,
      [supervisorId]
    );

    // Internships with dates for progress calculation
    const internshipsWithProgress = await query(
      `SELECT 
        i.id, i.title, i.start_date, i.end_date, i.duration_weeks,
        COUNT(DISTINCT ins.id)::int as total_students,
        COUNT(DISTINCT CASE WHEN ins.status = 'active' THEN ins.id END)::int as active_students
       FROM internships i
       LEFT JOIN projects p ON i.id = p.internship_id
       LEFT JOIN interns ins ON p.id = ins.project_id
       WHERE i.supervisor_id = $1
       GROUP BY i.id, i.title, i.start_date, i.end_date, i.duration_weeks`,
      [supervisorId]
    );

    // Calculate progress percentages
    const internshipsWithProgressData = internshipsWithProgress.rows.map((internship) => {
      let progressPercent = 0;
      if (internship.start_date && internship.end_date) {
        const now = new Date();
        const start = new Date(internship.start_date);
        const end = new Date(internship.end_date);
        const totalMs = end - start;
        const elapsedMs = now - start;
        progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
      }
      return {
        ...internship,
        progressPercent: Math.round(progressPercent),
        daysRemaining: internship.end_date 
          ? Math.ceil((new Date(internship.end_date) - new Date()) / (24 * 60 * 60 * 1000))
          : null
      };
    });

    res.json({
      studentStats: studentStats.rows[0],
      projectStats: projectStats.rows,
      internships: internshipsWithProgressData
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard stats for student
export const getStudentDashboardStats = async (req, res, next) => {
  try {
    const { id: userId } = req.user;

    const student = await query(
      `SELECT s.id FROM students s WHERE s.user_id = $1`,
      [userId]
    );

    if (!student.rows.length) {
      return res.status(403).json({ error: "Not authorized as student" });
    }

    // Student's internship stats
    const internshipStats = await query(
      `SELECT 
        i.id, i.status, i.start_date, i.end_date,
        p.title as project_title, su.full_name as supervisor_name,
        su.company_name as company_name
       FROM interns i
       JOIN projects p ON i.project_id = p.id
       JOIN supervisors su ON i.supervisor_id = su.id
       WHERE i.student_id = $1
       ORDER BY i.created_at DESC`,
      [student.rows[0].id]
    );

    // Calculate progress for each internship
    const internshipsWithProgress = internshipStats.rows.map((internship) => {
      let progressPercent = 0;
      let daysRemaining = null;
      if (internship.start_date && internship.end_date) {
        const now = new Date();
        const start = new Date(internship.start_date);
        const end = new Date(internship.end_date);
        const totalMs = end - start;
        const elapsedMs = now - start;
        progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
        daysRemaining = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
      }
      return {
        ...internship,
        progressPercent: Math.round(progressPercent),
        daysRemaining
      };
    });

    // Tasks stats
    const taskStats = await query(
      `SELECT 
        COUNT(DISTINCT t.id)::int as total,
        COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END)::int as todo,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END)::int as in_progress,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int as done
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN interns i ON p.id = i.project_id
       WHERE i.student_id = $1`,
      [student.rows[0].id]
    );

    res.json({
      internships: internshipsWithProgress,
      taskStats: taskStats.rows[0] || { total: 0, todo: 0, in_progress: 0, done: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// Get admin dashboard stats
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({ error: "Not authorized as admin" });
    }

    // Global stats
    const globalStats = await query(
      `SELECT 
        (SELECT COUNT(*)::int FROM users) as total_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*)::int FROM users WHERE role = 'supervisor') as total_supervisors,
        (SELECT COUNT(*)::int FROM interns) as total_interns,
        (SELECT COUNT(DISTINCT company_name)::int FROM supervisors) as total_companies,
        (SELECT COUNT(*)::int FROM internships) as total_internships,
        (SELECT COUNT(*)::int FROM applications) as total_applications,
        (SELECT COUNT(*)::int FROM projects) as total_projects`
    );

    // Supervisor stats
    const supervisorStats = await query(
      `SELECT 
        su.id, su.full_name, su.position,
        su.company_name,
        COUNT(DISTINCT i.id)::int as managed_students,
        COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END)::int as active_students,
        COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END)::int as completed_students
       FROM supervisors su
       LEFT JOIN interns i ON su.id = i.supervisor_id
       GROUP BY su.id, su.full_name, su.position, su.company_name
       ORDER BY managed_students DESC`
    );

    // Top projects by student count
    const topProjects = await query(
      `SELECT 
        p.id, p.title, COUNT(DISTINCT i.id)::int as student_count
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
