#!/usr/bin/env node

import bcrypt from "bcryptjs";
import pool from "../src/config/db.js";
import { logger } from "../src/utils/logger.js";

const PASSWORDS = {
  admin: "Admin123!",
  company: "Company123!",
  supervisor: "Supervisor123!",
  student: "Student123!"
};

const seedDemoSupervisors = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    logger.info("🌱 Seeding 2 supervisors with 3 interns each + 1 admin...");

    // ===== CREATE ADMIN =====
    const adminUser = await client.query(
      `INSERT INTO users (email, password_hash, role, is_email_verified)
       VALUES ($1, $2, 'admin', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email, role`,
      ["admin@demo.local", await bcrypt.hash(PASSWORDS.admin, 10)]
    );
    logger.info(`✓ Admin created: ${adminUser.rows[0].email}`);

    // ===== CREATE COMPANIES =====
    const company1User = await client.query(
      `INSERT INTO users (email, password_hash, role, is_email_verified)
       VALUES ($1, $2, 'company', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email`,
      ["company1@demo.local", await bcrypt.hash(PASSWORDS.company, 10)]
    );

    const company2User = await client.query(
      `INSERT INTO users (email, password_hash, role, is_email_verified)
       VALUES ($1, $2, 'company', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email`,
      ["company2@demo.local", await bcrypt.hash(PASSWORDS.company, 10)]
    );

    const company1 = await client.query(
      `INSERT INTO companies (user_id, name, description, location, website)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [company1User.rows[0].id, "Tech Solutions Inc", "Premier fournisseur de solutions web et mobile", "Casablanca", "https://techsolutions.demo"]
    );

    const company2 = await client.query(
      `INSERT INTO companies (user_id, name, description, location, website)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [company2User.rows[0].id, "Digital Innovation Labs", "Agence spécialisée en data science et cloud", "Rabat", "https://diglabs.demo"]
    );

    const company1Id = company1.rows[0].id;
    const company2Id = company2.rows[0].id;

    logger.info(`✓ Created 2 companies`);

    // ===== CREATE SUPERVISORS =====
    const supervisor1User = await client.query(
      `INSERT INTO users (email, password_hash, role, is_email_verified)
       VALUES ($1, $2, 'supervisor', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email`,
      ["supervisor1@demo.local", await bcrypt.hash(PASSWORDS.supervisor, 10)]
    );

    const supervisor2User = await client.query(
      `INSERT INTO users (email, password_hash, role, is_email_verified)
       VALUES ($1, $2, 'supervisor', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email`,
      ["supervisor2@demo.local", await bcrypt.hash(PASSWORDS.supervisor, 10)]
    );

    const supervisor1 = await client.query(
      `INSERT INTO supervisors (user_id, company_id, full_name, position)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [supervisor1User.rows[0].id, company1Id, "Mohamed Bennani", "Lead Developer"]
    );

    const supervisor2 = await client.query(
      `INSERT INTO supervisors (user_id, company_id, full_name, position)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [supervisor2User.rows[0].id, company2Id, "Fatima El-Qasimi", "Data Science Manager"]
    );

    const supervisor1Id = supervisor1.rows[0].id;
    const supervisor2Id = supervisor2.rows[0].id;

    logger.info(`✓ Created 2 supervisors`);

    // ===== CREATE INTERNSHIPS =====
    const internship1 = await client.query(
      `INSERT INTO internships (company_id, title, description, location, domain, duration, required_skills, moderation_status, is_active, start_date, end_date, duration_weeks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', true, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 26)
       RETURNING id`,
      [company1Id, "Web Development Project", "Développement d'une plateforme SaaS", "Casablanca", "Web", "6 months", "React,Node.js,PostgreSQL"]
    );

    const internship2 = await client.query(
      `INSERT INTO internships (company_id, title, description, location, domain, duration, required_skills, moderation_status, is_active, start_date, end_date, duration_weeks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', true, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '5 months 30 days', 26)
       RETURNING id`,
      [company2Id, "Machine Learning Pipeline", "Création d'un pipeline ML pour analyse de données", "Rabat", "Data Science", "6 months", "Python,TensorFlow,SQL"]
    );

    const internship1Id = internship1.rows[0].id;
    const internship2Id = internship2.rows[0].id;

    logger.info(`✓ Created 2 internships`);

    // ===== CREATE PROJECTS =====
    const project1 = await client.query(
      `INSERT INTO projects (internship_id, supervisor_id, title, description, objectives)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [internship1Id, supervisor1Id, "E-Commerce Platform", "Plateforme de commerce électronique complète", "Livrer une plateforme fonctionnelle avec paiement"]
    );

    const project2 = await client.query(
      `INSERT INTO projects (internship_id, supervisor_id, title, description, objectives)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [internship2Id, supervisor2Id, "Predictive Analytics Dashboard", "Tableau de bord d'analyse prédictive", "Développer des modèles de prédiction fiables"]
    );

    const project1Id = project1.rows[0].id;
    const project2Id = project2.rows[0].id;

    logger.info(`✓ Created 2 projects`);

    // ===== CREATE STUDENTS FOR SUPERVISOR 1 (3 INTERNS) =====
    const studentEmails1 = [
      { email: "amine.dev@demo.local", name: "Amine Dev", skills: "React,Node.js,PostgreSQL" },
      { email: "leila.web@demo.local", name: "Leila Web", skills: "HTML,CSS,JavaScript" },
      { email: "karim.fullstack@demo.local", name: "Karim FullStack", skills: "Vue.js,Python,MySQL" }
    ];

    const students1 = [];
    for (const studentData of studentEmails1) {
      const studentUser = await client.query(
        `INSERT INTO users (email, password_hash, role, is_email_verified)
         VALUES ($1, $2, 'student', true)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [studentData.email, await bcrypt.hash(PASSWORDS.student, 10)]
      );

      const student = await client.query(
        `INSERT INTO students (user_id, full_name, phone, education, skills, profile_completed, cv_url)
         VALUES ($1, $2, $3, $4, $5, true, $6)
         RETURNING id`,
        [studentUser.rows[0].id, studentData.name, "+212611000001", "Master Informatique", studentData.skills, "/uploads/student-cv.pdf"]
      );

      const studentId = student.rows[0].id;
      students1.push(studentId);
    }

    logger.info(`✓ Created 3 students for Supervisor 1`);

    // ===== CREATE STUDENTS FOR SUPERVISOR 2 (3 INTERNS) =====
    const studentEmails2 = [
      { email: "sara.data@demo.local", name: "Sara Data", skills: "Python,TensorFlow,SQL" },
      { email: "zohra.ai@demo.local", name: "Zohra AI", skills: "Machine Learning,Python,R" },
      { email: "hassan.analytics@demo.local", name: "Hassan Analytics", skills: "Data Analysis,SQL,PowerBI" }
    ];

    const students2 = [];
    for (const studentData of studentEmails2) {
      const studentUser = await client.query(
        `INSERT INTO users (email, password_hash, role, is_email_verified)
         VALUES ($1, $2, 'student', true)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [studentData.email, await bcrypt.hash(PASSWORDS.student, 10)]
      );

      const student = await client.query(
        `INSERT INTO students (user_id, full_name, phone, education, skills, profile_completed, cv_url)
         VALUES ($1, $2, $3, $4, $5, true, $6)
         RETURNING id`,
        [studentUser.rows[0].id, studentData.name, "+212611000002", "Master Data Science", studentData.skills, "/uploads/student-cv.pdf"]
      );

      const studentId = student.rows[0].id;
      students2.push(studentId);
    }

    logger.info(`✓ Created 3 students for Supervisor 2`);

    // ===== CREATE INTERNS (ACCEPTED STUDENTS) FOR SUPERVISOR 1 =====
    for (let i = 0; i < students1.length; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i * 10)); // Stagger start dates

      await client.query(
        `INSERT INTO interns (student_id, project_id, supervisor_id, acceptance_status, acceptance_date, confirmation_date, status, start_date, end_date)
         VALUES ($1, $2, $3, 'confirmed', NOW(), NOW(), 'active', $4, $4::date + INTERVAL '6 months')`,
        [students1[i], project1Id, supervisor1Id, startDate.toISOString().split('T')[0]]
      );
    }

    logger.info(`✓ Created 3 interns for Supervisor 1`);

    // ===== CREATE INTERNS (ACCEPTED STUDENTS) FOR SUPERVISOR 2 =====
    for (let i = 0; i < students2.length; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i * 15)); // Stagger start dates

      await client.query(
        `INSERT INTO interns (student_id, project_id, supervisor_id, acceptance_status, acceptance_date, confirmation_date, status, start_date, end_date)
         VALUES ($1, $2, $3, 'confirmed', NOW(), NOW(), 'active', $4, $4::date + INTERVAL '6 months')`,
        [students2[i], project2Id, supervisor2Id, startDate.toISOString().split('T')[0]]
      );
    }

    logger.info(`✓ Created 3 interns for Supervisor 2`);

    // ===== CREATE TASKS FOR PROJECTS =====
    await client.query(
      `INSERT INTO tasks (project_id, title, description, deadline, status)
       VALUES
        ($1, 'Setup project structure', 'Initialize repo and development environment', CURRENT_DATE + INTERVAL '3 days', 'todo'),
        ($1, 'API authentication', 'Implement JWT authentication', CURRENT_DATE + INTERVAL '7 days', 'in_progress'),
        ($1, 'Database schema', 'Create all necessary tables', CURRENT_DATE + INTERVAL '5 days', 'done')`,
      [project1Id]
    );

    await client.query(
      `INSERT INTO tasks (project_id, title, description, deadline, status)
       VALUES
        ($1, 'Data preprocessing', 'Clean and prepare training data', CURRENT_DATE + INTERVAL '5 days', 'todo'),
        ($1, 'Model training', 'Train ML models on datasets', CURRENT_DATE + INTERVAL '15 days', 'in_progress'),
        ($1, 'Evaluation metrics', 'Setup model evaluation framework', CURRENT_DATE + INTERVAL '10 days', 'done')`,
      [project2Id]
    );

    logger.info(`✓ Created tasks for both projects`);

    await client.query("COMMIT");
    logger.info("✅ Demo data seeding completed successfully!");
    logger.info("\n📋 Demo Credentials:");
    logger.info(`   Admin: admin@demo.local / ${PASSWORDS.admin}`);
    logger.info(`   Supervisor 1: supervisor1@demo.local / ${PASSWORDS.supervisor}`);
    logger.info(`   Supervisor 2: supervisor2@demo.local / ${PASSWORDS.supervisor}`);
    logger.info(`   Company 1: company1@demo.local / ${PASSWORDS.company}`);
    logger.info(`   Company 2: company2@demo.local / ${PASSWORDS.company}`);
    logger.info(`   Students: amine.dev@demo.local, leila.web@demo.local, karim.fullstack@demo.local`);
    logger.info(`              sara.data@demo.local, zohra.ai@demo.local, hassan.analytics@demo.local`);
    logger.info(`   Password for all: ${PASSWORDS.student}`);
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Error seeding demo data:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seedDemoSupervisors().catch((err) => {
  logger.error("Fatal error:", err);
  process.exit(1);
});
