import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info("server_started", {
    port: PORT,
    env: process.env.NODE_ENV || "development"
  });
});
