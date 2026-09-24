import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multerS3 from "multer-s3";
import jwt from "jsonwebtoken";

const client = new S3Client({ region: process.env.AWS_REGION || "ap-south-1" });
const localRoot = path.resolve(import.meta.dirname, "../../.local/resumes");

function assertLocalAllowed() {
  if (process.env.NODE_ENV === "production") {
    const error = new Error("Local resume storage is only available in development");
    error.status = 503;
    throw error;
  }
}

function localMode() {
  if (process.env.RESUME_STORAGE !== "local") return false;
  assertLocalAllowed();
  return true;
}

export function isLocalResume(key) { return typeof key === "string" && key.startsWith("local/"); }

function localPath(key) {
  const match = /^local\/([a-f\d]{24})\/([a-f\d-]{36})\.pdf$/.exec(key);
  if (!match) throw new Error("Invalid local resume key");
  return path.join(localRoot, match[1], `${match[2]}.pdf`);
}

function bucket() {
  if (!process.env.AWS_S3_BUCKET) {
    const error = new Error("Resume uploads are not configured");
    error.status = 503;
    throw error;
  }
  return process.env.AWS_S3_BUCKET;
}

function s3ObjectUrl(key) {
  const region = process.env.AWS_REGION || "ap-south-1";
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `https://${bucket()}.s3.${region}.amazonaws.com/${encodedKey}`;
}

export function createResumeStorage() {
  if (localMode()) return null;
  return multerS3({
    s3: client,
    bucket: (_req, _file, callback) => {
      try { callback(null, bucket()); }
      catch (error) { callback(error); }
    },
    acl: (_req, _file, callback) => callback(null, undefined),
    contentType: multerS3.AUTO_CONTENT_TYPE,
    serverSideEncryption: "AES256",
    cacheControl: "private, no-store",
    metadata: (req, _file, callback) => callback(null, { ownerId: req.user.id }),
    key: (req, _file, callback) => callback(null, `resumes/${req.user.id}/${randomUUID()}.pdf`)
  });
}

export async function uploadResume(userId, file) {
  if (localMode()) {
    const key = `local/${userId}/${randomUUID()}.pdf`;
    const destination = localPath(key);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.buffer, { flag: "wx", mode: 0o600 });
    return key;
  }
  const key = `resumes/${userId}/${randomUUID()}.pdf`;
  await client.send(new PutObjectCommand({
    Bucket: bucket(), Key: key, Body: file.buffer,
    ContentType: "application/pdf", ServerSideEncryption: "AES256"
  }));
  return key;
}

export async function finalizeResumeUpload(userId, file) {
  if (!file) return { resumeKey: undefined, resumeUrl: undefined };
  if (file.key) {
    if (file.contentType !== "application/pdf") {
      await deleteResume(file.key);
      const error = new Error("Upload a valid PDF file");
      error.status = 400;
      throw error;
    }
    return { resumeKey: file.key, resumeUrl: file.location || s3ObjectUrl(file.key) };
  }
  if (file.mimetype !== "application/pdf" || file.buffer?.subarray(0, 5).toString() !== "%PDF-") {
    const error = new Error("Upload a valid PDF file");
    error.status = 400;
    throw error;
  }
  const resumeKey = await uploadResume(userId, file);
  return { resumeKey, resumeUrl: isLocalResume(resumeKey) ? undefined : s3ObjectUrl(resumeKey) };
}

export async function discardResumeUpload(file) {
  if (file?.key) await deleteResume(file.key);
}

export async function getResumeUrl(key, { userId, applicationId, origin } = {}) {
  if (isLocalResume(key)) {
    assertLocalAllowed();
    const token = jwt.sign({ sub: userId, applicationId, purpose: "resume" }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "5m" });
    return `${origin}/api/applications/${applicationId}/resume/view?token=${encodeURIComponent(token)}`;
  }
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: 300 });
}

export async function readLocalResume(key) {
  assertLocalAllowed();
  return readFile(localPath(key));
}

export async function deleteResume(key) {
  if (!key) return;
  if (isLocalResume(key)) { await unlink(localPath(key)); return; }
  await client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
