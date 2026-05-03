import { query } from "../../config/db.js";

// Get weekly follow-ups for a student
export const getStudentWeeklyFollowUps = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { internId } = req.params;

    const student = await query(
      `SELECT s.id FROM students s WHERE s.user_id = $1`,
      [userId]
    );

    if (!student.rows.length) {
      return res.status(403).json({ error: "Not authorized as student" });
    }

    // Verify the intern belongs to the student
    const intern = await query(
      `SELECT id FROM interns WHERE id = $1 AND student_id = $2`,
      [internId, student.rows[0].id]
    );

    if (!intern.rows.length) {
      return res.status(404).json({ error: "Intern not found" });
    }

    const followUps = await query(
      `SELECT id, week_number, commit_hash, tasks_summary, challenges, submitted_at, created_at
       FROM weekly_follow_ups
       WHERE intern_id = $1
       ORDER BY week_number DESC`,
      [internId]
    );

    res.json(followUps.rows);
  } catch (error) {
    next(error);
  }
};

// Submit weekly follow-up
export const submitWeeklyFollowUp = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { internId, weekNumber, commitHash, tasksSummary, challenges } = req.body;

    if (!internId || !weekNumber) {
      return res.status(400).json({ error: "internId and weekNumber required" });
    }

    const student = await query(
      `SELECT s.id FROM students s WHERE s.user_id = $1`,
      [userId]
    );

    if (!student.rows.length) {
      return res.status(403).json({ error: "Not authorized as student" });
    }

    // Verify the intern belongs to the student
    const intern = await query(
      `SELECT id FROM interns WHERE id = $1 AND student_id = $2`,
      [internId, student.rows[0].id]
    );

    if (!intern.rows.length) {
      return res.status(404).json({ error: "Intern not found" });
    }

    const followUp = await query(
      `INSERT INTO weekly_follow_ups (intern_id, week_number, commit_hash, tasks_summary, challenges, submitted_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (intern_id, week_number) DO UPDATE
       SET commit_hash = EXCLUDED.commit_hash, tasks_summary = EXCLUDED.tasks_summary, 
           challenges = EXCLUDED.challenges, submitted_at = NOW()
       RETURNING id, week_number, commit_hash, tasks_summary, challenges, submitted_at`,
      [internId, weekNumber, commitHash, tasksSummary, challenges]
    );

    res.status(201).json(followUp.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Get all follow-ups for a supervisor's interns
export const getSupervisorFollowUps = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { internshipId } = req.params;

    const supervisor = await query(
      `SELECT id FROM supervisors WHERE user_id = $1`,
      [userId]
    );

    if (!supervisor.rows.length) {
      return res.status(403).json({ error: "Not authorized as supervisor" });
    }

    const followUps = await query(
      `SELECT 
        wfu.id, wfu.week_number, wfu.commit_hash, wfu.tasks_summary, wfu.challenges,
        wfu.submitted_at, s.full_name, s.email,
        i.id as intern_id
       FROM weekly_follow_ups wfu
       JOIN interns i ON wfu.intern_id = i.id
       JOIN students s ON i.student_id = s.id
       JOIN projects p ON i.project_id = p.id
       WHERE p.internship_id = $1 AND i.supervisor_id = $2
       ORDER BY wfu.submitted_at DESC`,
      [internshipId, supervisor.rows[0].id]
    );

    res.json(followUps.rows);
  } catch (error) {
    next(error);
  }
};
