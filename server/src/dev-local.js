import "dotenv/config";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server-core";

const localDir = path.resolve(import.meta.dirname, "../.local");
const dbPath = path.join(localDir, "db");
const secretPath = path.join(localDir, "jwt-secret");
process.env.RESUME_STORAGE ||= process.env.AWS_S3_BUCKET ? "s3" : "local";
process.env.AI_DEMO_MODE ||= process.env.GEMINI_API_KEY ? "false" : "true";

await mkdir(dbPath, { recursive: true });
if (!process.env.JWT_SECRET) {
  try {
    process.env.JWT_SECRET = (await readFile(secretPath, "utf8")).trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    process.env.JWT_SECRET = randomBytes(48).toString("base64url");
    await writeFile(secretPath, process.env.JWT_SECRET, { mode: 0o600, flag: "wx" });
  }
}

console.info("Starting local MongoDB. The first run may download its binary.");
const mongo = await MongoMemoryServer.create({
  instance: { dbPath, dbName: "applywise", storageEngine: "wiredTiger" }
});
process.env.MONGODB_URI = mongo.getUri("applywise");
console.info(`Local MongoDB ready at ${process.env.MONGODB_URI}`);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await mongo.stop({ doCleanup: false });
    process.exit(0);
  });
}

await import("./index.js");
