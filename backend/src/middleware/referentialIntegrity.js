import pool from "../config/db.js";

export const validateSupervisorExists = async (supervisorId) => {
  if (!supervisorId) {
    throw new Error("Supervisor ID is required");
  }

  const result = await pool.query(
    `SELECT sup.id, sup.full_name
     FROM supervisors sup
     JOIN users u ON u.id = sup.user_id
     WHERE sup.id = $1 AND u.is_active = true`,
    [supervisorId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Supervisor with ID ${supervisorId} does not exist or is inactive`);
  }

  return result.rows[0];
};

export const validateStudentSupervisorRelationship = async (studentId) => {
  if (!studentId) {
    throw new Error("Student ID is required");
  }

  const result = await pool.query(
    `SELECT
       s.id AS student_id,
       s.full_name AS student_name,
       s.created_by_supervisor_id,
       sup.id AS supervisor_id,
       sup.full_name AS supervisor_name,
       u.email AS supervisor_email,
       u.is_active AS supervisor_active
     FROM students s
     JOIN supervisors sup ON s.created_by_supervisor_id = sup.id
     JOIN users u ON sup.user_id = u.id
     WHERE s.id = $1`,
    [studentId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Student with ID ${studentId} does not exist`);
  }

  const student = result.rows[0];
  if (!student.supervisor_id) {
    throw new Error(`Student ${student.student_name} is not associated with any supervisor`);
  }

  if (!student.supervisor_active) {
    throw new Error(`Supervisor ${student.supervisor_name} is inactive`);
  }

  return student;
};

export const requireValidStudentSupervisorRelationship = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    req.validatedStudent = await validateStudentSupervisorRelationship(studentId);
    return next();
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      code: "REFERENTIAL_INTEGRITY_ERROR"
    });
  }
};

export const validateStudentManagementPermission = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const currentUser = req.user;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (currentUser.role === "admin") {
      return next();
    }

    const student = await validateStudentSupervisorRelationship(studentId);

    if (currentUser.role === "supervisor") {
      const supervisorCheck = await pool.query(
        `SELECT s.id
         FROM students s
         JOIN supervisors sup ON s.created_by_supervisor_id = sup.id
         WHERE s.id = $1 AND sup.user_id = $2`,
        [studentId, currentUser.id]
      );

      if (supervisorCheck.rows.length === 0) {
        return res.status(403).json({
          message: "You can only manage students you have created",
          code: "INSUFFICIENT_PERMISSIONS"
        });
      }
    }

    req.validatedStudent = student;
    return next();
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      code: "PERMISSION_ERROR"
    });
  }
};

export const performIntegrityCheck = async () => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total_students,
         COUNT(CASE WHEN created_by_supervisor_id IS NULL THEN 1 END)::int AS orphaned_students,
         COUNT(CASE WHEN sup.id IS NULL THEN 1 END)::int AS invalid_supervisor_refs
       FROM students s
       LEFT JOIN supervisors sup ON s.created_by_supervisor_id = sup.id`
    );

    const stats = result.rows[0];
    if (stats.orphaned_students > 0 || stats.invalid_supervisor_refs > 0) {
      console.error("Referential integrity issues detected", stats);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error during integrity check:", error);
    return false;
  }
};
