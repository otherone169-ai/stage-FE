import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { logger } from "../src/utils/logger.js";

// Load environment variables before importing DB pool
dotenv.config();
const { default: pool } = await import("../src/config/db.js");

const run = async () => {
  const client = await pool.connect();

  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`
    );

    const migrationsDir = path.resolve(process.cwd(), "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const already = await client.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [file]);
      if (already.rows.length > 0) {
        logger.info("migration_skipped", { file });
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");

      logger.info("migration_applied", { file });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("migration_failed", { message: error.message });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

run();
