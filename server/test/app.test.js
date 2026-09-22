import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

test("health endpoint responds", async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("applications require authentication", async () => {
  const response = await fetch(`${base}/api/applications`);
  assert.equal(response.status, 401);
});

test("invalid signup is rejected before database access", async () => {
  const response = await fetch(`${base}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "A", email: "invalid", password: "short" })
  });
  assert.equal(response.status, 400);
});
