import express from "express";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/cv", (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "cv_download" || !payload.cvUrl) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const filename = String(payload.cvUrl).replace("/uploads/", "");
    const filePath = path.resolve(process.cwd(), "uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    return res.download(filePath);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
