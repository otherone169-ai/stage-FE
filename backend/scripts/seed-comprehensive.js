#!/usr/bin/env node

import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("🌱 Seeding database...");

    // ===== ADMINS =====
    const adminUser = await client.query(
      `INSERT INTO users (email, password_hash, role, is_email_verified)
       VALUES ($1, $2, 'admin', true)
       RETURNING *`,
      ["admin@stageflow.com", await bcrypt.hash("AdminPassword123", 10)]
    );
    console.log("✓ Admin user created");

    // ===== COMPANIES & RH USERS =====
    const companySeeds = [
      {
        email: "rh.alpha@company.com",
        name: "Alpha Tech",
        description: "Product engineering, cloud infrastructure, and internal tooling",
        location: "Paris, France",
        website: "https://alpha.example.com"
      },
      {
        email: "rh.beta@company.com",
        name: "Beta Dynamics",
        description: "AI experimentation, analytics, and platform operations",
        location: "Lyon, France",
        website: "https://beta.example.com"
      }
    ];

    const companies = [];
    for (const companySeed of companySeeds) {
      const companyUser = await client.query(
        `INSERT INTO users (email, password_hash, role, is_email_verified)
         VALUES ($1, $2, 'company', true)
         RETURNING *`,
        [companySeed.email, await bcrypt.hash("CompanyPass123", 10)]
      );

      const company = await client.query(
        `INSERT INTO companies (user_id, name, description, location, website)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [companyUser.rows[0].id, companySeed.name, companySeed.description, companySeed.location, companySeed.website]
      );

      companies.push(company.rows[0]);
    }
    console.log(`✓ Created ${companies.length} companies with RH users`);

    // ===== SUPERVISORS =====
    const supervisors = [];
    for (let i = 0; i < companies.length; i++) {
      for (let j = 1; j <= 2; j++) {
        const supervisorUser = await client.query(
          `INSERT INTO users (email, password_hash, role, is_email_verified)
           VALUES ($1, $2, 'supervisor', true)
           RETURNING *`,
          [`supervisor${i * 2 + j}@stageflow.com`, await bcrypt.hash("SupervisorPass123", 10)]
        );

        const supervisor = await client.query(
          `INSERT INTO supervisors (user_id, company_id, full_name, position)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [
            supervisorUser.rows[0].id,
            companies[i].id,
            `Supervisor ${i * 2 + j} Name`,
            `Senior Developer`
          ]
        );

        supervisors.push(supervisor.rows[0]);
      }
    }
    console.log(`✓ Created ${supervisors.length} supervisors`);

    // ===== STUDENTS =====
    const students = [];
    for (let i = 1; i <= 8; i++) {
      const studentUser = await client.query(
        `INSERT INTO users (email, password_hash, role, is_email_verified)
         VALUES ($1, $2, 'student', true)
         RETURNING *`,
        [`student${i}@university.edu`, await bcrypt.hash("StudentPass123", 10)]
      );

      const student = await client.query(
        `INSERT INTO students (user_id, full_name, phone, skills, education, profile_completed)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [
          studentUser.rows[0].id,
          `Student ${i} Name`,
          `+33612345${String(i).padStart(3,  "0")}`,
          ["JavaScript", "React", "Node.js", "PostgreSQL"].join(","),
          `Master's in Computer Science, University of Paris`
        ]
      );

      students.push(student.rows[0]);
    }
    console.log(`✓ Created ${students.length} students`);

    // ===== INTERNSHIPS =====
    const internships = [];
    for (let i = 0; i < companies.length; i++) {
      for (let j = 1; j <= 3; j++) {
        const internship = await client.query(
          `INSERT INTO internships (company_id, title, description, location, duration, domain, required_skills, moderation_status, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', true)
           RETURNING *`,
          [
            companies[i].id,
            `Full Stack Developer Internship ${j}`,
            `Internship opportunity for ${j} Full Stack Developers at ${companies[i].name}`,
            `Paris, France`,
            `3-6 months`,
            `Web Development`,
            `JavaScript,React,Node.js,PostgreSQL`
          ]
        );

        internships.push(internship.rows[0]);
      }
    }
    console.log(`✓ Created ${internships.length} internships`);

    // ===== APPLICATIONS & WORKFLOW =====
    let internshipIndex = 0;
    for (let i = 0; i < students.length; i++) {
      const internship = internships[internshipIndex % internships.length];

      const application = await client.query(
        `INSERT INTO applications (student_id, internship_id, status)
         VALUES ($1, $2, 'accepted')
         RETURNING *`,
        [students[i].id, internship.id]
      );

      // Create project when application is accepted
      const supervisor = supervisors[internshipIndex % supervisors.length];
      const project = await client.query(
        `INSERT INTO projects (internship_id, supervisor_id, title, description, objectives)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          internship.id,
          supervisor.id,
          `Project for ${students[i].full_name}`,
          `Development project`,
          `Build and deploy a modern web application`
        ]
      );

      // Create intern record
      const intern = await client.query(
        `INSERT INTO interns (student_id, project_id, supervisor_id, status, start_date, end_date)
         VALUES ($1, $2, $3, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months')
         RETURNING *`,
        [students[i].id, project.rows[0].id, supervisor.id]
      );

      internshipIndex++;
    }
    console.log(`✓ Created ${students.length} applications and workflows`);

    // ===== TASKS =====
    let projectIndex = 0;
    const tasks = [];
    const projects = await client.query(
      `SELECT id FROM projects LIMIT 10`
    );

    for (const project of projects.rows) {
      for (let j = 1; j <= 3; j++) {
        const task = await client.query(
          `INSERT INTO tasks (project_id, title, description, deadline, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            project.id,
            `Task ${j}: Complete feature X`,
            `Implement and test feature X for the internship project`,
            `2026-05-${String(j * 10).padStart(2, "0")}`,
            j === 1 ? "todo" : j === 2 ? "in_progress" : "done"
          ]
        );

        tasks.push(task.rows[0]);
      }
    }
    console.log(`✓ Created ${tasks.length} tasks`);

    // ===== TASK REMARKS =====
    const interns = await client.query(
      `SELECT DISTINCT i.id, st.user_id as student_user_id FROM interns i JOIN students st ON st.id = i.student_id LIMIT 5`
    );

    let remarksCount = 0;
    for (const intern of interns.rows) {
      const internTasks = await client.query(
        `SELECT t.id FROM tasks t JOIN projects p ON p.id = t.project_id JOIN interns i ON i.project_id = p.id WHERE i.id = $1 LIMIT 2`,
        [intern.id]
      );

      for (const task of internTasks.rows) {
        await client.query(
          `INSERT INTO task_remarks (task_id, user_id, content)
           VALUES ($1, $2, $3)`,
          [
            task.id,
            intern.student_user_id,
            `Working on this task, progress is good. Need to discuss implementation approach with supervisor.`
          ]
        );
        remarksCount++;
      }
    }
    console.log(`✓ Created ${remarksCount} task remarks`);

    // ===== FEEDBACKS =====
    const internList = await client.query(
      `SELECT DISTINCT i.id, s.id as supervisor_id FROM interns i JOIN projects p ON p.id = i.project_id JOIN supervisors s ON s.id = p.supervisor_id LIMIT 5`
    );

    let feedbackCount = 0;
    for (const item of internList.rows) {
      await client.query(
        `INSERT INTO feedbacks (supervisor_id, intern_id, comment, rating)
         VALUES ($1, $2, $3, $4)`,
        [item.supervisor_id, item.id, `Excellent work so far. Keep up the good effort!`, 4.5]
      );
      feedbackCount++;
    }
    console.log(`✓ Created ${feedbackCount} feedbacks`);

    // ===== REPORTS =====
    const reportsInterns = await client.query(
      `SELECT i.id, s.id as student_id, s.user_id FROM interns i JOIN students s ON s.id = i.student_id LIMIT 3`
    );

    let reportCount = 0;
    for (const item of reportsInterns.rows) {
      await client.query(
        `INSERT INTO reports (intern_id, student_id, title, content, status)
         VALUES ($1, $2, $3, $4, 'draft')`,
        [item.id, item.student_id, `Internship Report - Week 1-2`, `Summary of first two weeks of internship work...`]
      );
      reportCount++;
    }
    console.log(`✓ Created ${reportCount} draft reports`);

    // ===== NOTIFICATIONS =====
    let notificationCount = 0;
    for (const student of students.slice(0, 3)) {
      await client.query(
        `INSERT INTO notifications (user_id, type, message, is_read)
         VALUES ($1, $2, $3, false)`,
        [
          student.user_id,
          "application_accepted",
          `Your application has been accepted! A supervisor will be assigned soon.`
        ]
      );
      notificationCount++;
    }
    console.log(`✓ Created ${notificationCount} notifications`);

    // ===== MESSAGES =====
    let messageCount = 0;
    for (let i = 0; i < Math.min(students.length, supervisors.length); i++) {
      const student = students[i];
      const supervisor = supervisors[i % supervisors.length];

      // Message from student to supervisor
      await client.query(
        `INSERT INTO messages (sender_id, receiver_id, content)
         VALUES ($1, $2, $3)`,
        [student.user_id, supervisor.user_id, `Hi, I wanted to discuss the project timeline with you.`]
      );

      // Reply from supervisor
      await client.query(
        `INSERT INTO messages (sender_id, receiver_id, content)
         VALUES ($1, $2, $3)`,
        [
          supervisor.user_id,
          student.user_id,
          `Sure! Let's schedule a meeting tomorrow at 10 AM.`
        ]
      );

      messageCount += 2;
    }
    console.log(`✓ Created ${messageCount} messages`);

    await client.query("COMMIT");

    console.log(`\n✅ Database seeding completed successfully!`);
    console.log(`
📊 Summary:
  - 1 admin user
  - 2 companies with RH users
  - 6 supervisors
  - 8 students
  - 6 internships
  - 8 applications & workflows
  - 18 tasks
  - Multiple remarks, feedbacks, reports, notifications, and messages
    `);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error seeding database:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDatabase();
