import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import pool from "../src/config/db.js";
import { logger } from "../src/utils/logger.js";

dotenv.config();

const run = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const adminEmail = "admin@platform.local";
    const studentEmail = "student@platform.local";
    const companyEmail = "company@platform.local";

    const adminPwd = await bcrypt.hash("Admin123!", 10);
    const studentPwd = await bcrypt.hash("Student123!", 10);
    const companyPwd = await bcrypt.hash("Company123!", 10);

    const admin = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'admin', true)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [adminEmail, adminPwd]
    );

    const studentUser = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'student', true)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [studentEmail, studentPwd]
    );

    const companyUser = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'company', true)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [companyEmail, companyPwd]
    );

    const company = await client.query(
      `INSERT INTO companies (user_id, name, description, location, website)
       VALUES ($1, 'Demo Company', 'Internship-focused company', 'Casablanca', 'https://demo-company.local')
       ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [companyUser.rows[0].id]
    );

    const supervisorUser = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'supervisor', true)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      ['supervisor@platform.local', await bcrypt.hash('Supervisor123!', 10)]
    );

    const supervisor = await client.query(
      `INSERT INTO supervisors (user_id, company_id, full_name, position)
       VALUES ($1, $2, 'Demo Supervisor', 'Project Manager')
       ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id
       RETURNING id`,
      [supervisorUser.rows[0].id, company.rows[0].id]
    );

    const student = await client.query(
      `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, profile_completed)
       VALUES ($1, $2, 'Demo Student', '0600000000', 'Computer Science', 'react,node,postgresql', '1 year projects', true)
       ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, created_by_supervisor_id = EXCLUDED.created_by_supervisor_id
       RETURNING id`,
      [studentUser.rows[0].id, supervisor.rows[0].id]
    );

    const demoProject = await client.query(
      `INSERT INTO projects (supervisor_id, title, description, objectives)
       VALUES ($1, 'Full-stack stage', 'Build web features', 'Deliver MVP')
       RETURNING id`,
      [supervisor.rows[0].id]
    );

    await client.query(
      `INSERT INTO interns (student_id, project_id, supervisor_id, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (student_id, project_id) DO NOTHING`,
      [student.rows[0].id, demoProject.rows[0].id, supervisor.rows[0].id]
    );

    await client.query("COMMIT");

    logger.info("seed_completed", {
      adminEmail,
      studentEmail,
      companyEmail
    });
    void admin;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("seed_failed", { message: error.message });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

run();
