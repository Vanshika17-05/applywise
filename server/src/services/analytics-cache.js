import { createClient } from "redis";

const TTL_SECONDS = 5 * 60;
let clientPromise;
let warned = false;
let retryAt = 0;

async function redisClient() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (Date.now() < retryAt) return null;

  if (!clientPromise) {
    const client = createClient({
      url,
      socket: { connectTimeout: 2_000, reconnectStrategy: false }
    });
    client.on("error", (error) => {
      if (!warned) {
        warned = true;
        console.warn("Redis analytics cache unavailable", { message: error.message });
      }
    });
    clientPromise = client.connect().then(() => {
      retryAt = 0;
      return client;
    }).catch((error) => {
      clientPromise = undefined;
      retryAt = Date.now() + 30_000;
      if (!warned) {
        warned = true;
        console.warn("Redis analytics cache connection failed", { message: error.message });
      }
      return null;
    });
  }

  return clientPromise;
}

async function versionFor(client, userId) {
  return (await client.get(`analytics:version:${userId}`)) || "0";
}

export async function cachedAnalytics(userId, signature, calculate) {
  const client = await redisClient();
  if (!client) return { data: await calculate(), cache: "BYPASS" };

  let key;
  try {
    const version = await versionFor(client, userId);
    key = `analytics:${userId}:${version}:${signature}`;
    const cached = await client.get(key);
    if (cached) return { data: JSON.parse(cached), cache: "HIT" };
  } catch (error) {
    console.warn("Redis analytics cache read failed", { message: error.message });
    return { data: await calculate(), cache: "BYPASS" };
  }

  const data = await calculate();
  try {
    await client.setEx(key, TTL_SECONDS, JSON.stringify(data));
    return { data, cache: "MISS" };
  } catch (error) {
    console.warn("Redis analytics cache write failed", { message: error.message });
    return { data, cache: "BYPASS" };
  }
}

export async function invalidateAnalyticsCache(userId) {
  const client = await redisClient();
  if (!client) return;
  try {
    await client.incr(`analytics:version:${userId}`);
  } catch (error) {
    console.warn("Redis analytics cache invalidation failed", { message: error.message });
  }
}

export const ANALYTICS_CACHE_TTL_SECONDS = TTL_SECONDS;
