import { query } from "../config/db.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const [interns, supervisors, tasks, reports] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM interns"),
      query("SELECT COUNT(*)::int AS count FROM supervisors"),
      query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'done')::int AS done FROM tasks"),
      query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'validated')::int AS validated FROM reports")
    ]);

    const taskTotal = tasks.rows[0].total || 0;
    const done = tasks.rows[0].done || 0;

    const progress = taskTotal > 0 ? Math.round((done / taskTotal) * 100) : 0;

    return res.json({
      interns: interns.rows[0].count,
      supervisors: supervisors.rows[0].count,
      tasks: {
        total: taskTotal,
        done,
        progress
      },
      reports: {
        total: reports.rows[0].total,
        validated: reports.rows[0].validated
      }
    });
  } catch (error) {
    return next(error);
  }
};
