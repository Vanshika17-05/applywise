import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import jwt from "jsonwebtoken";
import { awsBucketName, isS3Configured, s3 } from "../config/s3.js";

const localRoot = path.resolve(import.meta.dirname, "../../.local/profile-photos");
const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function localMode() {
  if (isS3Configured) return false;
  return process.env.NODE_ENV !== "production";
}

export function profilePhotoStorageMode() {
  if (isS3Configured) return "s3";
  return process.env.NODE_ENV === "production" ? "mongo" : "local";
}

function localPath(key) {
  const match = /^local-photo\/([a-f\d]{24})\/([a-f\d-]{36})\.(jpg|png|webp)$/.exec(key);
  if (!match) throw new Error("Invalid local profile photo key");
  return path.join(localRoot, match[1], `${match[2]}.${match[3]}`);
}

export function isLocalProfilePhoto(key) {
  return typeof key === "string" && key.startsWith("local-photo/");
}

export function isMongoProfilePhoto(key) {
  return typeof key === "string" && key.startsWith("mongo-photo/");
}

export function validProfilePhoto(file) {
  if (!file || !extensions[file.mimetype]) return false;
  const bytes = file.buffer;
  if (file.mimetype === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
}

export async function uploadProfilePhoto(userId, file) {
  const extension = extensions[file.mimetype];
  if (profilePhotoStorageMode() === "mongo") return `mongo-photo/${userId}/${randomUUID()}.${extension}`;
  if (localMode()) {
    const key = `local-photo/${userId}/${randomUUID()}.${extension}`;
    const destination = localPath(key);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.buffer, { flag: "wx", mode: 0o600 });
    return key;
  }
  const key = `profile-photos/${userId}/${randomUUID()}.${extension}`;
  await s3.send(new PutObjectCommand({
    Bucket: awsBucketName, Key: key, Body: file.buffer,
    ContentType: file.mimetype, ServerSideEncryption: "AES256"
  }));
  return key;
}

export async function getProfilePhotoUrl(key, { userId, origin }) {
  if (!key) return null;
  if (isLocalProfilePhoto(key) || isMongoProfilePhoto(key)) {
    if (isLocalProfilePhoto(key) && process.env.NODE_ENV === "production") return null;
    const token = jwt.sign({ sub: userId, purpose: "profile-photo", key }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
    return `${origin}/api/auth/photo/view?token=${encodeURIComponent(token)}`;
  }
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: awsBucketName, Key: key }), { expiresIn: 3600 });
}

export async function readLocalProfilePhoto(key) {
  return readFile(localPath(key));
}

export async function deleteProfilePhoto(key) {
  if (!key) return;
  if (isMongoProfilePhoto(key)) return;
  if (isLocalProfilePhoto(key)) { await unlink(localPath(key)); return; }
  await s3.send(new DeleteObjectCommand({ Bucket: awsBucketName, Key: key }));
}
