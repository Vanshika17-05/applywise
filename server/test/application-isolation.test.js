import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server-core";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";
import { Application } from "../src/models/Application.js";

let mongo;
let server;
let base;
let migrationVerified = false;

async function request(path, { token, method = "GET", body } = {}) {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  if (body && !(body instanceof FormData)) headers["content-type"] = "application/json";
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  return { response, data };
}

async function register(name, email) {
  const { response, data } = await request("/auth/register", {
    method: "POST",
    body: { name, email, password: "IsolationTest!2026" }
  });
  assert.equal(response.status, 201);
  return data;
}

async function addApplication(token, index) {
  const form = new FormData();
  form.set("company", `User A Company ${index}`);
  form.set("role", `Role ${index}`);
  form.set("jobUrl", "");
  form.set("dateApplied", "2026-09-24");
  form.set("status", "Applied");
  form.set("priority", "Medium");
  form.set("notes", "Tenant isolation test");
  const { response, data } = await request("/applications", { token, method: "POST", body: form });
  assert.equal(response.status, 201);
  return data.application;
}

before(async () => {
  process.env.JWT_SECRET = "application-isolation-test-secret-at-least-32-characters";
  process.env.AI_DEMO_MODE = "true";
  mongo = await MongoMemoryServer.create({ instance: { dbName: "applywise-isolation" } });
  process.env.MONGODB_URI = mongo.getUri("applywise-isolation");
  const legacyOwner = new mongoose.Types.ObjectId();
  const seedConnection = await mongoose.createConnection(process.env.MONGODB_URI).asPromise();
  const legacy = await seedConnection.collection("applications").insertOne({
    user: legacyOwner,
    company: "Legacy Company",
    role: "Legacy Role",
    dateApplied: new Date("2026-09-01"),
    status: "Applied",
    priority: "Medium",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await seedConnection.close();
  await connectDatabase();
  const migrated = await mongoose.connection.collection("applications").findOne({ _id: legacy.insertedId });
  migrationVerified = migrated?.userId?.toString() === legacyOwner.toString();
  await mongoose.connection.collection("applications").deleteOne({ _id: legacy.insertedId });
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongo?.stop();
});

test("legacy application ownership is migrated to userId", () => {
  assert.equal(migrationVerified, true);
});

test("applications are isolated by the authenticated user ID", async () => {
  const userA = await register("User A", "user-a@example.com");
  const initialA = await request("/applications", { token: userA.token });
  assert.equal(initialA.response.status, 200);
  assert.deepEqual(initialA.data.applications, []);

  const created = [];
  for (let index = 1; index <= 3; index += 1) created.push(await addApplication(userA.token, index));

  const stored = await Application.find({}).select("+userId").lean();
  assert.equal(stored.length, 3);
  assert.ok(stored.every((application) => application.userId.toString() === userA.user.id), "POST must save the authenticated userId");

  const userB = await register("User B", "user-b@example.com");
  const listB = await request("/applications", { token: userB.token });
  assert.equal(listB.response.status, 200);
  assert.deepEqual(listB.data.applications, [], "User B must not receive User A's applications");

  const updateByB = await request(`/applications/${created[0]._id}`, { token: userB.token, method: "PATCH", body: { status: "Interview" } });
  assert.equal(updateByB.response.status, 404);
  const deleteByB = await request(`/applications/${created[0]._id}`, { token: userB.token, method: "DELETE" });
  assert.equal(deleteByB.response.status, 404);
  const aiByB = await request("/ai/generate-email", { token: userB.token, method: "POST", body: { applicationId: created[0]._id } });
  assert.equal(aiByB.response.status, 404);

  const listA = await request("/applications", { token: userA.token });
  assert.equal(listA.response.status, 200);
  assert.equal(listA.data.applications.length, 3, "User A's applications must remain intact");
});
