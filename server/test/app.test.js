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

test("global limiter returns structured 429 and Retry-After", async () => {
  let response;
  for (let attempt = 0; attempt < 110; attempt += 1) {
    response = await fetch(`${base}/api/health`);
    if (response.status === 429) break;
  }
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
  const body = await response.json();
  assert.equal(body.error, "rate_limit_exceeded");
  assert.ok(body.retryAfter > 0);
});
