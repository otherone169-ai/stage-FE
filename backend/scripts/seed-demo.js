import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import pool from "../src/config/db.js";
import { logger } from "../src/utils/logger.js";

dotenv.config();

const PASSWORDS = {
  admin: "Admin123!",
  company: "Company123!",
  supervisor: "Supervisor123!",
  student: "Student123!"
};

const DEMO_USERS = [
  { key: "admin", email: "admin.demo@platform.local", role: "admin", password: PASSWORDS.admin },
  { key: "company1", email: "company.alpha@platform.local", role: "company", password: PASSWORDS.company },
  { key: "company2", email: "company.beta@platform.local", role: "company", password: PASSWORDS.company },
  { key: "supervisor1", email: "supervisor.alpha1@platform.local", role: "supervisor", password: PASSWORDS.supervisor },
  { key: "supervisor2", email: "supervisor.alpha2@platform.local", role: "supervisor", password: PASSWORDS.supervisor },
  { key: "supervisor3", email: "supervisor.beta1@platform.local", role: "supervisor", password: PASSWORDS.supervisor },
  { key: "student1", email: "student.one@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student2", email: "student.two@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student3", email: "student.three@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student4", email: "student.four@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student5", email: "student.incomplete@platform.local", role: "student", password: PASSWORDS.student }
];

const upsertUser = async (client, { email, role, password }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await client.query(
    `INSERT INTO users (email, password_hash, role, is_active)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (email)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       is_active = true
     RETURNING id, email, role`,
    [email, passwordHash, role]
  );

  return result.rows[0];
};

const insertDemoData = async (client, ids) => {
  const companyAlpha = await client.query(
    `INSERT INTO companies (user_id, name, description, location, website)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      ids.company1,
      "Alpha Tech",
      "Agence produit orientee web, data et automatisation",
      "Casablanca",
      "https://alpha-tech.demo.local"
    ]
  );

  const companyBeta = await client.query(
    `INSERT INTO companies (user_id, name, description, location, website)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      ids.company2,
      "Beta Systems",
      "Societe orientee qualite logicielle, infra et mobile",
      "Rabat",
      "https://beta-systems.demo.local"
    ]
  );

  const companies = {
    alpha: companyAlpha.rows[0].id,
    beta: companyBeta.rows[0].id
  };

  const supervisor1 = await client.query(
    `INSERT INTO supervisors (user_id, company_id, full_name, position)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [ids.supervisor1, companies.alpha, "Sara El Fassi", "Engineering Manager"]
  );

  const supervisor2 = await client.query(
    `INSERT INTO supervisors (user_id, company_id, full_name, position)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [ids.supervisor2, companies.alpha, "Youssef Benali", "Data Lead"]
  );

  const supervisor3 = await client.query(
    `INSERT INTO supervisors (user_id, company_id, full_name, position)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [ids.supervisor3, companies.beta, "Nadia Rahmouni", "QA Lead"]
  );

  const supervisors = {
    alphaEng: supervisor1.rows[0].id,
    alphaData: supervisor2.rows[0].id,
    betaQa: supervisor3.rows[0].id
  };

  const student1 = await client.query(
    `INSERT INTO students (user_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, true)
     RETURNING id`,
    [
      ids.student1,
      "Amine Idrissi",
      "0611000001",
      "Master Genie Logiciel",
      "react,node,postgresql,testing",
      "Projet e-commerce full-stack",
      JSON.stringify({ location: "Casablanca", domain: "Web", duration: "6 months", skills: ["react", "node"] }),
      "/uploads/demo-amine-cv.pdf"
    ]
  );

  const student2 = await client.query(
    `INSERT INTO students (user_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, true)
     RETURNING id`,
    [
      ids.student2,
      "Salma Berrada",
      "0611000002",
      "Licence Informatique",
      "python,sql,powerbi,excel",
      "Analyse de donnees academique",
      JSON.stringify({ location: "Casablanca", domain: "Data", duration: "4 months", skills: ["python", "sql"] }),
      "/uploads/demo-salma-cv.pdf"
    ]
  );

  const student3 = await client.query(
    `INSERT INTO students (user_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, true)
     RETURNING id`,
    [
      ids.student3,
      "Imane Trabelsi",
      "0611000003",
      "Master Data Science",
      "python,ml,statistics,sql",
      "Mini-projets ML",
      JSON.stringify({ location: "Casablanca", domain: "Data", duration: "6 months", skills: ["ml", "python", "sql"] }),
      "/uploads/demo-imane-cv.pdf"
    ]
  );

  const student4 = await client.query(
    `INSERT INTO students (user_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, true)
     RETURNING id`,
    [
      ids.student4,
      "Karim Alaoui",
      "0611000004",
      "Master Cloud & DevOps",
      "docker,kubernetes,linux,ci/cd",
      "Projet de deploiement cloud",
      JSON.stringify({ location: "Rabat", domain: "DevOps", duration: "6 months", skills: ["docker", "kubernetes"] }),
      "/uploads/demo-karim-cv.pdf"
    ]
  );

  const student5 = await client.query(
    `INSERT INTO students (user_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NULL, false)
     RETURNING id`,
    [
      ids.student5,
      "Noura Incomplete",
      null,
      "Licence en cours",
      "html,css",
      null,
      JSON.stringify({ location: "Casablanca", domain: "Web", duration: "2 months", skills: ["html"] })
    ]
  );

  const students = {
    one: student1.rows[0].id,
    two: student2.rows[0].id,
    three: student3.rows[0].id,
    four: student4.rows[0].id,
    incomplete: student5.rows[0].id
  };

  const internship1 = await client.query(
    `INSERT INTO internships
      (company_id, title, description, location, duration, domain, requirements, required_skills, moderation_status, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', false)
     RETURNING id`,
    [
      companies.alpha,
      "Full-Stack Web Intern",
      "Developper des fonctionnalites API et React sur un produit SaaS",
      "Casablanca",
      "6 months",
      "Web",
      "Bonne base JavaScript et SQL",
      "react,node,postgresql,api"
    ]
  );

  const internship2 = await client.query(
    `INSERT INTO internships
      (company_id, title, description, location, duration, domain, requirements, required_skills, moderation_status, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', true)
     RETURNING id`,
    [
      companies.alpha,
      "Data Analyst Intern",
      "Preparation de dashboards metier et nettoyage de donnees",
      "Casablanca",
      "4 months",
      "Data",
      "SQL, reporting et data storytelling",
      "sql,powerbi,python"
    ]
  );

  const internship3 = await client.query(
    `INSERT INTO internships
      (company_id, title, description, location, duration, domain, requirements, required_skills, moderation_status, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', true)
     RETURNING id`,
    [
      companies.beta,
      "DevOps Platform Intern",
      "Automatiser les pipelines CI/CD et observabilite",
      "Rabat",
      "6 months",
      "DevOps",
      "Docker, Linux, CI/CD",
      "docker,linux,github-actions"
    ]
  );

  const internship4 = await client.query(
    `INSERT INTO internships
      (company_id, title, description, location, duration, domain, requirements, required_skills, moderation_status, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'rejected', false)
     RETURNING id`,
    [
      companies.beta,
      "QA Automation Intern",
      "Mise en place de tests UI et API",
      "Rabat",
      "3 months",
      "QA",
      "Playwright ou Cypress, tests API",
      "testing,cypress,api"
    ]
  );

  const internship5 = await client.query(
    `INSERT INTO internships
      (company_id, title, description, location, duration, domain, requirements, required_skills, moderation_status, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', true)
     RETURNING id`,
    [
      companies.beta,
      "Mobile App Intern",
      "Contribuer a une application mobile interne",
      "Rabat",
      "5 months",
      "Mobile",
      "React Native basique",
      "react-native,typescript,api"
    ]
  );

  const internship6 = await client.query(
    `INSERT INTO internships
      (company_id, title, description, location, duration, domain, requirements, required_skills, moderation_status, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', false)
     RETURNING id`,
    [
      companies.beta,
      "Legacy Backend Migration Intern",
      "Migration d'une API monolithique vers une architecture modulaire",
      "Rabat",
      "6 months",
      "Backend",
      "Node.js, SQL, architecture",
      "node,postgresql,architecture"
    ]
  );

  const internships = {
    webClosed: internship1.rows[0].id,
    dataOpen: internship2.rows[0].id,
    devopsPendingModeration: internship3.rows[0].id,
    qaRejectedModeration: internship4.rows[0].id,
    mobileOpen: internship5.rows[0].id,
    backendClosed: internship6.rows[0].id
  };

  const applicationAccepted = await client.query(
    `INSERT INTO applications (student_id, internship_id, status)
     VALUES ($1, $2, 'accepted')
     RETURNING id`,
    [students.one, internships.webClosed]
  );

  await client.query(
    `INSERT INTO applications (student_id, internship_id, status)
     VALUES ($1, $2, 'rejected')`,
    [students.two, internships.webClosed]
  );

  const applicationPending = await client.query(
    `INSERT INTO applications (student_id, internship_id, status)
     VALUES ($1, $2, 'pending')
     RETURNING id`,
    [students.three, internships.dataOpen]
  );

  await client.query(
    `INSERT INTO applications (student_id, internship_id, status)
     VALUES ($1, $2, 'rejected')`,
    [students.four, internships.dataOpen]
  );

  await client.query(
    `INSERT INTO applications (student_id, internship_id, status)
     VALUES ($1, $2, 'pending')`,
    [students.two, internships.mobileOpen]
  );

  const applicationAcceptedHistoric = await client.query(
    `INSERT INTO applications (student_id, internship_id, status)
     VALUES ($1, $2, 'accepted')
     RETURNING id`,
    [students.four, internships.backendClosed]
  );

  const project1 = await client.query(
    `INSERT INTO projects (internship_id, supervisor_id, title, description, objectives)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      internships.webClosed,
      supervisors.alphaEng,
      "SaaS Dashboard Evolution",
      "Iteration produit sur dashboard et API metier",
      "Livrer 3 fonctionnalites majeures"
    ]
  );

  const project2 = await client.query(
    `INSERT INTO projects (internship_id, supervisor_id, title, description, objectives)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      internships.backendClosed,
      supervisors.alphaData,
      "Backend Migration Batch",
      "Refonte progressive de modules API",
      "Cloturer migration de deux domaines"
    ]
  );

  const intern1 = await client.query(
    `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date, end_date)
     VALUES ($1, $2, $3, 'active', CURRENT_DATE - INTERVAL '20 days', NULL)
     RETURNING id`,
    [students.one, project1.rows[0].id, supervisors.alphaEng]
  );

  const intern2 = await client.query(
    `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date, end_date)
     VALUES ($1, $2, $3, 'completed', CURRENT_DATE - INTERVAL '200 days', CURRENT_DATE - INTERVAL '20 days')
     RETURNING id`,
    [students.four, project2.rows[0].id, supervisors.alphaData]
  );

  const task1 = await client.query(
    `INSERT INTO tasks (project_id, title, description, deadline, status)
     VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'todo')
     RETURNING id`,
    [project1.rows[0].id, "Implement KPI cards", "Add KPI cards with API data"]
  );

  const task2 = await client.query(
    `INSERT INTO tasks (project_id, title, description, deadline, status)
     VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '2 days', 'in_progress')
     RETURNING id`,
    [project1.rows[0].id, "Refactor auth middleware", "Improve token checks and error handling"]
  );

  const task3 = await client.query(
    `INSERT INTO tasks (project_id, title, description, deadline, status)
     VALUES ($1, $2, $3, CURRENT_DATE - INTERVAL '2 days', 'done')
     RETURNING id`,
    [project1.rows[0].id, "Write integration tests", "Add integration tests for internships"]
  );

  const task4 = await client.query(
    `INSERT INTO tasks (project_id, title, description, deadline, status)
     VALUES ($1, $2, $3, CURRENT_DATE - INTERVAL '40 days', 'done')
     RETURNING id`,
    [project2.rows[0].id, "Migrate candidates module", "Move candidate workflow to new schema"]
  );

  const task5 = await client.query(
    `INSERT INTO tasks (project_id, title, description, deadline, status)
     VALUES ($1, $2, $3, CURRENT_DATE - INTERVAL '10 days', 'done')
     RETURNING id`,
    [project2.rows[0].id, "Close migration report", "Finalize migration and documentation"]
  );

  await client.query(
    `INSERT INTO task_updates (task_id, intern_id, progress, status, file_url)
     VALUES
      ($1, $2, $3, 'in_progress', NULL),
      ($4, $2, $5, 'done', '/uploads/demo-task-proof-1.pdf'),
      ($6, $7, $8, 'done', '/uploads/demo-task-proof-2.pdf')`,
    [
      task2.rows[0].id,
      intern1.rows[0].id,
      "Middleware refactor started: token validation and DB checks done",
      task3.rows[0].id,
      "Integration tests green on auth/internships",
      task4.rows[0].id,
      intern2.rows[0].id,
      "Migration module delivered and validated"
    ]
  );

  await client.query(
    `INSERT INTO feedbacks (supervisor_id, intern_id, comment, rating)
     VALUES
      ($1, $2, $3, 4.30),
      ($4, $5, $6, 4.80)`,
    [
      supervisors.alphaEng,
      intern1.rows[0].id,
      "Bon rythme et tres bonne communication.",
      supervisors.alphaData,
      intern2.rows[0].id,
      "Excellent niveau technique et autonomie."
    ]
  );

  await client.query(
    `INSERT INTO documents (user_id, type, file_url)
     VALUES
      ($1, 'cv', '/uploads/demo-amine-cv.pdf'),
      ($2, 'cv', '/uploads/demo-salma-cv.pdf'),
      ($3, 'cv', '/uploads/demo-imane-cv.pdf'),
      ($4, 'cv', '/uploads/demo-karim-cv.pdf')`,
    [ids.student1, ids.student2, ids.student3, ids.student4]
  );

  await client.query(
    `INSERT INTO notifications (user_id, type, message, is_read)
     VALUES
      ($1, 'application_status', 'Votre candidature Full-Stack Web Intern a ete acceptee', false),
      ($2, 'application_status', 'Votre candidature Data Analyst Intern est en cours de revue', false),
      ($3, 'application_received', 'Nouvelle candidature recue pour Data Analyst Intern', true),
      ($4, 'task_update', 'Nouvelle mise a jour de tache soumise par un stagiaire', false),
      ($5, 'moderation', 'Une offre DevOps est en attente de moderation', false),
      ($6, 'message', 'Vous avez recu un nouveau message', true)`,
    [ids.student1, ids.student3, ids.company1, ids.supervisor1, ids.admin, ids.student2]
  );

  await client.query(
    `INSERT INTO messages (sender_id, receiver_id, content)
     VALUES
      ($1, $2, 'Bonjour, je suis interesse par votre offre Data Analyst.'),
      ($2, $1, 'Merci, votre profil est en cours d evaluation.'),
      ($3, $4, 'Pouvez-vous valider ma derniere mise a jour de tache ?'),
      ($4, $3, 'Oui, je vous fais un retour cet apres-midi.'),
      ($5, $6, 'La moderation de cette offre est toujours en attente.')`,
    [ids.student3, ids.company1, ids.student1, ids.supervisor1, ids.company2, ids.admin]
  );

  await client.query(
    `INSERT INTO matches (student_id, internship_id, score)
     VALUES
      ($1, $2, 91.50),
      ($3, $4, 87.20),
      ($5, $6, 73.00)`,
    [students.three, internships.dataOpen, students.one, internships.webClosed, students.two, internships.mobileOpen]
  );

  await client.query(
    `INSERT INTO audit_logs (user_id, action, metadata)
     VALUES
      ($1, 'DEMO_SEED_RUN', '{"source":"seed-demo","version":1}'::jsonb),
      ($2, 'APPLICATION_REVIEWED', '{"result":"accepted"}'::jsonb),
      ($3, 'SUPERVISOR_ASSIGNED', '{"intern":"active"}'::jsonb),
      ($4, 'TASK_UPDATE_SUBMITTED', '{"status":"in_progress"}'::jsonb),
      ($5, 'INTERNSHIP_MODERATED', '{"status":"pending"}'::jsonb)`,
    [ids.admin, ids.company1, ids.company1, ids.student1, ids.admin]
  );

  const activeResetRawToken = "DEMO-RESET-STUDENT-TWO";
  const activeResetHash = crypto.createHash("sha256").update(activeResetRawToken).digest("hex");
  const usedResetHash = crypto.createHash("sha256").update("DEMO-USED-COMPANY-ALPHA").digest("hex");

  await client.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at)
     VALUES
      ($1, $2, NOW() + INTERVAL '30 minutes', NULL),
      ($3, $4, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')`,
    [ids.student2, activeResetHash, ids.company1, usedResetHash]
  );

  return {
    applications: {
      accepted: applicationAccepted.rows[0].id,
      pending: applicationPending.rows[0].id,
      acceptedHistoric: applicationAcceptedHistoric.rows[0].id
    },
    resetTokenForDemo: activeResetRawToken
  };
};

const run = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM audit_logs WHERE action LIKE 'DEMO_%'");
    await client.query("DELETE FROM users WHERE email = ANY($1::text[])", [DEMO_USERS.map((u) => u.email)]);

    const ids = {};
    for (const user of DEMO_USERS) {
      const created = await upsertUser(client, user);
      ids[user.key] = created.id;
    }

    const metadata = await insertDemoData(client, ids);

    await client.query("COMMIT");

    logger.info("seed_demo_completed", {
      accounts: DEMO_USERS.map((u) => ({ email: u.email, role: u.role })),
      passwords: {
        admin: PASSWORDS.admin,
        company: PASSWORDS.company,
        supervisor: PASSWORDS.supervisor,
        student: PASSWORDS.student
      },
      sampleResetToken: metadata.resetTokenForDemo,
      sampleApplicationIds: metadata.applications
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("seed_demo_failed", { message: error.message });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

run();
