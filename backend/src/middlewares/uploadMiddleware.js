import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    // CRITICAL FIX #4: Use cryptographically secure random filename
    const ext = path.extname(file.originalname || "").toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${randomName}${ext}`);
  }
});

const allowedMime = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const fileFilter = (req, file, cb) => {
  if (!allowedMime.has(file.mimetype)) {
    cb(new Error("Unsupported file type. Only PDF/DOC/DOCX are allowed."));
    return;
  }
  cb(null, true);
};

export const uploadCV = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (file.mimetype !== "application/pdf" || ext !== ".pdf") {
    cb(new Error("Seuls les fichiers PDF sont acceptés."));
    return;
  }
  cb(null, true);
};

export const uploadPdf = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
