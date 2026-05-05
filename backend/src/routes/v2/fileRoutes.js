import express from "express";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { query } from "../../config/db.js";

const router = express.Router();

router.get("/cv", async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "cv_download" || !payload.cvUrl) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // MEDIUM FIX #5: Verify file ownership before allowing download
    const userId = payload.userId;
    const cvUrl = payload.cvUrl;

    // Check if this CV belongs to the requesting user or if user is supervisor/admin
    const ownershipCheck = await query(
      `SELECT 
        CASE 
          WHEN u.role = 'admin' THEN true
          WHEN u.role = 'supervisor' THEN (
            EXISTS (
              SELECT 1 FROM students s 
              WHERE s.cv_url = $2 AND 
              EXISTS (
                SELECT 1 FROM interns i 
                JOIN projects p ON p.id = i.project_id 
                WHERE i.student_id = s.id AND p.supervisor_id = sv.id
              )
            )
          )
          WHEN u.role = 'student' THEN (
            EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.cv_url = $2)
          )
          ELSE false
        END as has_access
       FROM users u
       LEFT JOIN supervisors sv ON sv.user_id = u.id
       WHERE u.id = $1`,
      [userId, cvUrl]
    );

    if (!ownershipCheck.rows.length || !ownershipCheck.rows[0].has_access) {
      return res.status(403).json({ message: "Access denied - you don't have permission to access this file" });
    }

    const filename = String(cvUrl).replace("/uploads/", "");
    const filePath = path.resolve(process.cwd(), "uploads", filename);

    // Additional security: ensure file is within uploads directory
    if (!filePath.startsWith(path.resolve(process.cwd(), "uploads"))) {
      return res.status(403).json({ message: "Access denied - invalid file path" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Log file access for audit
    await query(
      "INSERT INTO audit_logs (user_id, action, metadata) VALUES ($1, $2, $3)",
      [userId, "FILE_CV_DOWNLOADED", JSON.stringify({ cvUrl, timestamp: new Date().toISOString() })]
    );

    return res.download(filePath);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
