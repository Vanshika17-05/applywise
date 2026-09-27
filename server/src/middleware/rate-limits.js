import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../services/analytics-cache.js";

function retryAfterSeconds(req, windowMs) {
  const reset = req.rateLimit?.resetTime?.getTime?.();
  return Math.max(1, reset ? Math.ceil((reset - Date.now()) / 1000) : Math.ceil(windowMs / 1000));
}

function handler(windowMs) {
  return (req, res) => {
    const retryAfter = retryAfterSeconds(req, windowMs);
    res.set("Retry-After", String(retryAfter)).status(429).json({ error: "rate_limit_exceeded", retryAfter });
  };
}

function redisStore(prefix) {
  if (process.env.NODE_TEST_CONTEXT) return undefined;
  return new RedisStore({
    prefix,
    sendCommand: async (...args) => {
      const client = await redisClient();
      if (!client) throw new Error("REDIS_URL is required for distributed rate limiting");
      return client.sendCommand(args);
    }
  });
}

function build(options) {
  const { prefix, ...limiterOptions } = options;
  return rateLimit({
    standardHeaders: "draft-8",
    legacyHeaders: false,
    passOnStoreError: true,
    handler: handler(options.windowMs),
    ...limiterOptions,
    store: redisStore(prefix)
  });
}

export const globalApiLimiter = build({ prefix: "rl:global:", windowMs: 15 * 60_000, limit: 100 });
export const authenticatedUserLimiter = build({
  prefix: "rl:user:", windowMs: 15 * 60_000, limit: 300,
  keyGenerator: (req) => String(req.user.id)
});
export const sensitiveUserLimiter = build({
  prefix: "rl:sensitive:", windowMs: 60 * 60_000, limit: 10,
  keyGenerator: (req) => String(req.user.id)
});
