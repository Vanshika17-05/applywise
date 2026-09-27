import test from "node:test";
import assert from "node:assert/strict";
import { createSession, listSessions, revokeOtherSessions, revokeSession, sessionIsActive } from "../src/services/sessions.js";

test("sessions can be listed and revoked immediately", async () => {
  const userId = `session-user-${Date.now()}`;
  const first = await createSession(userId, "First browser");
  const second = await createSession(userId, "Second browser");
  assert.equal((await listSessions(userId)).length, 2);
  assert.equal(await sessionIsActive(userId, first.jti), true);
  await revokeOtherSessions(userId, second.jti);
  assert.equal(await sessionIsActive(userId, first.jti), false);
  assert.equal(await sessionIsActive(userId, second.jti), true);
  await revokeSession(userId, second.jti);
  assert.equal(await sessionIsActive(userId, second.jti), false);
});
