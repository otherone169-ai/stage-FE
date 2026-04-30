import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "stage_management"
});

const run = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const users = [
      { email: "student.test@platform.local", role: "student", password: "Student123!" },
      { email: "company.test@platform.local", role: "company", password: "Company123!" },
      { email: "supervisor.test@platform.local", role: "supervisor", password: "Supervisor123!" },
      { email: "admin.test@platform.local", role: "admin", password: "Admin123!" }
    ];

    const created = {};

    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      const result = await client.query(
        "INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, true) RETURNING id, email, role",
        [user.email, hash, user.role]
      );
      created[user.role] = result.rows[0];
    }

    const company = await client.query(
      "INSERT INTO companies (user_id, name, description, location, website) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [
        created.company.id,
        "Company Test",
        "Company test profile",
        "Casablanca",
        "https://company.test.local"
      ]
    );

    await client.query(
      "INSERT INTO students (user_id, full_name, phone, education, skills, experience, profile_completed) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        created.student.id,
        "Student Test",
        "0600000000",
        "Computer Science",
        "react,node,postgresql",
        "Academic projects",
        true
      ]
    );

    await client.query(
      "INSERT INTO supervisors (user_id, company_id, full_name, position) VALUES ($1, $2, $3, $4)",
      [created.supervisor.id, company.rows[0].id, "Supervisor Test", "Engineering Lead"]
    );

    await client.query("COMMIT");
    console.log("ROLE_USERS_CREATED");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

run();
