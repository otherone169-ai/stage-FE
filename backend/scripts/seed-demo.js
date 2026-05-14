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
  { key: "supervisor", email: "supervisor.demo@platform.local", role: "supervisor", password: PASSWORDS.supervisor },
  { key: "supervisor1", email: "supervisor.alpha1@platform.local", role: "supervisor", password: PASSWORDS.supervisor },
  { key: "supervisor2", email: "supervisor.alpha2@platform.local", role: "supervisor", password: PASSWORDS.supervisor },
  { key: "supervisor3", email: "supervisor.beta1@platform.local", role: "supervisor", password: PASSWORDS.supervisor },
  { key: "student1", email: "student.one@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student2", email: "student.two@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student3", email: "student.three@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student4", email: "student.four@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student5", email: "student.five@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student6", email: "student.six@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student7", email: "student.seven@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student8", email: "student.eight@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student9", email: "student.nine@platform.local", role: "student", password: PASSWORDS.student },
  { key: "student10", email: "student.ten@platform.local", role: "student", password: PASSWORDS.student }
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

  const supervisorDemo = await client.query(
    `INSERT INTO supervisors (user_id, company_id, full_name, position)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [ids.supervisor, companies.alpha, "Demo Supervisor", "Project Manager"]
  );

  const supervisor3 = await client.query(
    `INSERT INTO supervisors (user_id, company_id, full_name, position)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [ids.supervisor3, companies.beta, "Nadia Rahmouni", "QA Lead"]
  );

  const supervisors = {
    demo: supervisorDemo.rows[0].id,
    alphaEng: supervisor1.rows[0].id,
    alphaData: supervisor2.rows[0].id,
    betaQa: supervisor3.rows[0].id
  };

  const student1 = await client.query(
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student1,
      supervisors.alphaEng,
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
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student2,
      supervisors.alphaEng,
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
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student3,
      supervisors.alphaData,
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
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student4,
      supervisors.alphaData,
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
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student5,
      supervisors.demo,
      "Omar El Kettani",
      "0611000005",
      "Master en Cybersécurité",
      "python,security,networking,firewall",
      "Audit de sécurité réseau",
      JSON.stringify({ location: "Casablanca", domain: "Security", duration: "6 months", skills: ["python", "security"] }),
      "/uploads/demo-omar-cv.pdf"
    ]
  );

  const student6 = await client.query(
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student6,
      supervisors.demo,
      "Fatima Zahra",
      "0611000006",
      "Licence Marketing Digital",
      "seo,analytics,facebook-ads,google-ads",
      "Campagne marketing pour e-commerce",
      JSON.stringify({ location: "Rabat", domain: "Marketing", duration: "4 months", skills: ["seo", "analytics"] }),
      "/uploads/demo-fatima-cv.pdf"
    ]
  );

  const student7 = await client.query(
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student7,
      supervisors.betaQa,
      "Yassine Amrani",
      "0611000007",
      "Master UX/UI Design",
      "figma,sketch,adobe-xd,prototyping,css",
      "Design application mobile banking",
      JSON.stringify({ location: "Marrakech", domain: "Design", duration: "5 months", skills: ["figma", "ux"] }),
      "/uploads/demo-yassine-cv.pdf"
    ]
  );

  const student8 = await client.query(
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student8,
      supervisors.betaQa,
      "Khadija Mansouri",
      "0611000008",
      "Ingénieur en Télécommunications",
      "5g,networking,voip,cisco,protocols",
      "Optimisation réseau 5G",
      JSON.stringify({ location: "Casablanca", domain: "Network", duration: "6 months", skills: ["5g", "networking"] }),
      "/uploads/demo-khadija-cv.pdf"
    ]
  );

  const student9 = await client.query(
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student9,
      supervisors.alphaEng,
      "Adam Benjelloun",
      "0611000009",
      "Master Intelligence Artificielle",
      "tensorflow,pytorch,nlp,computer-vision,python",
      "Modèle de reconnaissance d'images",
      JSON.stringify({ location: "Rabat", domain: "AI", duration: "6 months", skills: ["tensorflow", "ai"] }),
      "/uploads/demo-adam-cv.pdf"
    ]
  );

  const student10 = await client.query(
    `INSERT INTO students (user_id, created_by_supervisor_id, full_name, phone, education, skills, experience, preferences, cv_url, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, true)
     RETURNING id`,
    [
      ids.student10,
      supervisors.demo,
      "Mariam El Idrissi",
      "0611000010",
      "Master Business Intelligence",
      "tableau,powerbi,sql,data-warehousing,etl",
      "Création dashboard KPIs",
      JSON.stringify({ location: "Casablanca", domain: "BI", duration: "5 months", skills: ["tableau", "bi"] }),
      "/uploads/demo-mariam-cv.pdf"
    ]
  );

  const students = {
    one: student1.rows[0].id,
    two: student2.rows[0].id,
    three: student3.rows[0].id,
    four: student4.rows[0].id,
    five: student5.rows[0].id,
    six: student6.rows[0].id,
    seven: student7.rows[0].id,
    eight: student8.rows[0].id,
    nine: student9.rows[0].id,
    ten: student10.rows[0].id
  };

  const project1 = await client.query(
    `INSERT INTO projects (supervisor_id, title, description, objectives, location, duration, domain, requirements)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      supervisors.alphaEng,
      "E-commerce Platform",
      "Développer les fonctionnalités panier et paiement pour une plateforme e-commerce",
      "Implémenter un système de panier avec gestion des stocks et intégration paiement Stripe",
      "Casablanca",
      "6 months",
      "Web",
      "React, Node, SQL"
    ]
  );

  // Projects for Demo Supervisor
  const projectDemo1 = await client.query(
    `INSERT INTO projects (supervisor_id, title, description, objectives, location, duration, domain, requirements)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      supervisors.demo,
      "Application de Gestion de Stage",
      "Développer une application web complète pour la gestion des stages",
      "Créer une plateforme avec authentification, dashboard, et système de notifications",
      "Casablanca",
      "6 mois",
      "Web Development",
      "React, Node.js, PostgreSQL, Git"
    ]
  );

  const projectDemo2 = await client.query(
    `INSERT INTO projects (supervisor_id, title, description, objectives, location, duration, domain, requirements)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      supervisors.demo,
      "Mobile Banking App",
      "Contribuer au développement d'une application mobile bancaire",
      "Développer les fonctionnalités de transfert d'argent et consultation de solde",
      "Remote",
      "4 mois",
      "Mobile Development",
      "React Native, TypeScript, REST APIs"
    ]
  );

  const project2 = await client.query(
    `INSERT INTO projects (supervisor_id, title, description, objectives, location, duration, domain, requirements)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      supervisors.alphaData,
      "Backend Migration Batch",
      "Refonte progressive de modules API",
      "Cloturer migration de deux domaines",
      "Rabat",
      "6 months",
      "Backend",
      "Node.js, SQL, architecture"
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

  // Assign some students to Demo Supervisor projects (leave some pending for testing)
  const internDemo1 = await client.query(
    `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date)
     VALUES ($1, $2, $3, 'active', CURRENT_DATE - INTERVAL '30 days')
     RETURNING id`,
    [students.five, projectDemo1.rows[0].id, supervisors.demo]
  );

  const internDemo2 = await client.query(
    `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date)
     VALUES ($1, $2, $3, 'active', CURRENT_DATE - INTERVAL '15 days')
     RETURNING id`,
    [students.six, projectDemo2.rows[0].id, supervisors.demo]
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

  // Tasks for Demo Supervisor Projects
  const taskDemo1 = await client.query(
    `INSERT INTO tasks (project_id, title, description, deadline, status)
     VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '14 days', 'todo')
     RETURNING id`,
    [projectDemo1.rows[0].id, "Configuration Authentification", "Mettre en place JWT et middleware d'auth"]
  );

  const taskDemo2 = await client.query(
    `INSERT INTO tasks (project_id, title, description, deadline, status)
     VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '21 days', 'todo')
     RETURNING id`,
    [projectDemo1.rows[0].id, "Dashboard Supervisor", "Créer interface admin pour gestion des stages"]
  );

  const taskDemo3 = await client.query(
    `INSERT INTO tasks (project_id, title, description, deadline, status)
     VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', 'in_progress')
     RETURNING id`,
    [projectDemo2.rows[0].id, "Setup React Native", "Configuration environnement et structure de base"]
  );

  const taskDemo4 = await client.query(
    `INSERT INTO tasks (project_id, title, description, deadline, status)
     VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '14 days', 'todo')
     RETURNING id`,
    [projectDemo2.rows[0].id, "API Banking Integration", "Connecter backend banking APIs"]
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
    `INSERT INTO audit_logs (user_id, action, metadata)
     VALUES
      ($1, 'DEMO_SEED_RUN', '{"source":"seed-demo","version":1}'::jsonb),
      ($2, 'APPLICATION_REVIEWED', '{"result":"accepted"}'::jsonb),
      ($3, 'SUPERVISOR_ASSIGNED', '{"intern":"active"}'::jsonb),
      ($4, 'TASK_UPDATE_SUBMITTED', '{"status":"in_progress"}'::jsonb),
      ($5, 'PROJECT_CREATED', '{"title":"Backend Migration"}'::jsonb)`,
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
      sampleResetToken: metadata.resetTokenForDemo
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
