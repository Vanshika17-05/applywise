import { randomUUID } from "node:crypto";
import { redisClient } from "./analytics-cache.js";

const TTL_SECONDS = 7 * 24 * 60 * 60;
const memory = new Map();

const key = (userId) => `sessions:${userId}`;

export async function createSession(userId, userAgent = "Unknown device") {
  const session = { jti: randomUUID(), userId: String(userId), issuedAt: new Date().toISOString(), userAgent: String(userAgent).slice(0, 300) };
  const redis = await redisClient();
  if (redis) {
    await redis.hSet(key(userId), session.jti, JSON.stringify(session));
    await redis.expire(key(userId), TTL_SECONDS);
  } else memory.set(session.jti, session);
  return session;
}

export async function sessionIsActive(userId, jti) {
  if (!jti) return false;
  const redis = await redisClient();
  return redis ? Boolean(await redis.hExists(key(userId), jti)) : memory.get(jti)?.userId === String(userId);
}

export async function listSessions(userId) {
  const redis = await redisClient();
  if (redis) return Object.values(await redis.hGetAll(key(userId))).map((value) => JSON.parse(value));
  return [...memory.values()].filter((session) => session.userId === String(userId));
}

export async function revokeSession(userId, jti) {
  const redis = await redisClient();
  if (redis) return redis.hDel(key(userId), jti);
  if (memory.get(jti)?.userId === String(userId)) memory.delete(jti);
}

export async function revokeOtherSessions(userId, currentJti) {
  const sessions = await listSessions(userId);
  await Promise.all(sessions.filter(({ jti }) => jti !== currentJti).map(({ jti }) => revokeSession(userId, jti)));
}
