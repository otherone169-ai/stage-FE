import pool, { query } from "../../config/db.js";

// Get acceptance workflows for a student
export const getStudentAcceptanceWorkflows = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    
    const student = await query(
      `SELECT id FROM students WHERE user_id = $1`,
      [userId]
    );

    if (!student.rows.length) {
      return res.status(403).json({ error: "Not authorized as student" });
    }

    const workflows = await query(
      `SELECT 
        aw.id, aw.status, aw.project_title, aw.supervisor_message,
        su.full_name as supervisor_name, su.position,
        aw.email_sent_at, aw.student_confirmed_at, aw.created_at
       FROM acceptance_workflows aw
       JOIN supervisors su ON aw.supervisor_id = su.id
       WHERE aw.student_id = $1
       ORDER BY aw.created_at DESC`,
      [student.rows[0].id]
    );

    res.json(workflows.rows);
  } catch (error) {
    next(error);
  }
};

// Student confirms acceptance
export const confirmAcceptance = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { workflowId } = req.body;

    if (!workflowId) {
      return res.status(400).json({ error: "workflowId required" });
    }

    const student = await query(
      `SELECT id FROM students WHERE user_id = $1`,
      [userId]
    );

    if (!student.rows.length) {
      return res.status(403).json({ error: "Not authorized as student" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get workflow and update
      const workflow = await client.query(
        `SELECT * FROM acceptance_workflows 
         WHERE id = $1 AND student_id = $2 AND status = 'accepted'`,
        [workflowId, student.rows[0].id]
      );

      if (!workflow.rows.length) {
        throw new Error("Workflow not found or already confirmed");
      }

      await client.query(
        `UPDATE acceptance_workflows SET status = 'confirmed', student_confirmed_at = NOW()
         WHERE id = $1`,
        [workflowId]
      );

      // Update interns status
      await client.query(
        `UPDATE interns SET acceptance_status = 'confirmed', confirmation_date = NOW()
         WHERE project_id = $1 AND student_id = $2`,
        [workflow.rows[0].project_id, student.rows[0].id]
      );

      // Create notification for supervisor
      const supervisor = await client.query(
        `SELECT su.user_id FROM supervisors su WHERE su.id = $1`,
        [workflow.rows[0].supervisor_id]
      );

      await client.query(
        `INSERT INTO notifications (user_id, type, message)
         VALUES ($1, 'confirmation', $2)`,
        [supervisor.rows[0].user_id, `Student has confirmed acceptance for: ${workflow.rows[0].project_title}`]
      );

      await client.query("COMMIT");
      res.json({ success: true, message: "Acceptance confirmed" });
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
