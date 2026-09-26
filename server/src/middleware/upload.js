import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import multerS3 from "multer-s3";
import { awsBucketName, isS3Configured, s3 } from "../config/s3.js";

const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"]
]);

const storage = isS3Configured ? multerS3({
  s3,
  bucket: awsBucketName,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  serverSideEncryption: "AES256",
  cacheControl: "private, no-store",
  metadata: (req, _file, callback) => callback(null, { ownerId: req.user.id }),
  key: (req, file, callback) => {
    const extension = allowed.get(file.mimetype) || path.extname(file.originalname).slice(1).toLowerCase();
    callback(null, `profile-photos/${req.user.id}-${Date.now()}-${randomUUID()}.${extension}`);
  }
}) : multer.memoryStorage();

export const profilePhotoUpload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (allowed.has(file.mimetype) && file.mimetype.startsWith("image/")) return callback(null, true);
    const error = new Error("Upload a JPG, PNG, or WebP image");
    error.status = 400;
    return callback(error);
  }
});

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype === "application/pdf" && file.originalname.toLowerCase().endsWith(".pdf")) return callback(null, true);
    const error = new Error("Upload a valid PDF file");
    error.status = 400;
    return callback(error);
  }
});
