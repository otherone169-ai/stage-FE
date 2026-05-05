import pg from "pg";

const { Pool } = pg;

// MEDIUM FIX #4: Configure connection pool for better performance under load
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "stage_management",
  // Connection pool configuration
  max: Number(process.env.DB_POOL_MAX) || 20, // Maximum number of clients in the pool
  min: Number(process.env.DB_POOL_MIN) || 5,  // Minimum number of clients in the pool
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT) || 2000, // How long to wait when connecting a new client
});

export const query = (text, params) => pool.query(text, params);
export default pool;
