import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import adminRoutes from "./routes/v2/adminRoutes.js";
import authRoutes from "./routes/v2/authRoutes.js";
import dashboardRoutes from "./routes/v2/dashboardRoutes.js";
import fileRoutes from "./routes/v2/fileRoutes.js";
import studentRoutes from "./routes/v2/studentRoutes.js";
import supervisorRoutes from "./routes/v2/supervisorRoutes.js";
import projectRoutes from "./routes/v2/projectRoutes.js";
import taskRoutes from "./routes/v2/taskRoutes.js";
import reportRoutes from "./routes/v2/reportRoutes.js";
import workflowRoutes from "./routes/v2/workflowRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import { requestContext } from "./middlewares/requestContext.js";
import { query } from "./config/db.js";

dotenv.config();

const app = express();

const expandAllowedOrigin = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = new URL(value);
    const origins = new Set([parsed.origin]);

    if (parsed.hostname === "localhost") {
      origins.add(`${parsed.protocol}//127.0.0.1${parsed.port ? `:${parsed.port}` : ""}`);
    }

    if (parsed.hostname === "127.0.0.1") {
      origins.add(`${parsed.protocol}//localhost${parsed.port ? `:${parsed.port}` : ""}`);
    }

    return Array.from(origins);
  } catch {
    return [value];
  }
};

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.APP_PUBLIC_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:8081",
    "http://127.0.0.1:8081"
  ].flatMap(expandAllowedOrigin)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(requestContext);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/supervisors", supervisorRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/workflow", workflowRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
