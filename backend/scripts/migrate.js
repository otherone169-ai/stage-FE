import dotenv from "dotenv";
import { logger } from "../src/utils/logger.js";
import { applyMigrations } from "./applyMigrations.js";

dotenv.config();
const { default: pool } = await import("../src/config/db.js");

try {
  await applyMigrations(pool);
} catch (error) {
  logger.error("migration_failed", { message: error.message });
  process.exitCode = 1;
} finally {
  await pool.end();
}
