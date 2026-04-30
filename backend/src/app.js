import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import adminRoutes from "./routes/v2/adminRoutes.js";
import applicationRoutes from "./routes/v2/applicationRoutes.js";
import authRoutes from "./routes/v2/authRoutes.js";
import companyRoutes from "./routes/v2/companyRoutes.js";
import dashboardRoutes from "./routes/v2/dashboardRoutes.js";
import internshipRoutes from "./routes/v2/internshipRoutes.js";
import fileRoutes from "./routes/v2/fileRoutes.js";
import studentRoutes from "./routes/v2/studentRoutes.js";
import supervisorRoutes from "./routes/v2/supervisorRoutes.js";
import projectRoutes from "./routes/v2/projectRoutes.js";
import taskRoutes from "./routes/v2/taskRoutes.js";
import reportRoutes from "./routes/v2/reportRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import { requestContext } from "./middlewares/requestContext.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
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
app.use("/api/companies", companyRoutes);
app.use("/api/supervisors", supervisorRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/files", fileRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
