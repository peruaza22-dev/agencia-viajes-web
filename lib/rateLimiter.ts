import { Redis } from '@upstash/redis';

const memoryRateLimit = new Map<string, { count: number; expiresAt: number }>();
let redis: Redis | null = null;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

function memoryFallback(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const memoryKey = `rate:${key}`;
  const existing = memoryRateLimit.get(memoryKey);

  if (existing && existing.expiresAt <= now) {
    memoryRateLimit.delete(memoryKey);
  }

  const current = (existing && existing.expiresAt > now ? existing.count : 0) + 1;
  memoryRateLimit.set(memoryKey, {
    count: current,
    expiresAt: now + windowSeconds * 1000,
  });

  return {
    ok: current <= limit,
    retryAfter: current <= limit ? 0 : windowSeconds,
  };
}

export async function getRateLimit(key: string, limit: number, windowSeconds: number) {
  const redisClient = getRedis();

  if (!redisClient) {
    return memoryFallback(key, limit, windowSeconds);
  }

  try {
    const redisKey = `rate:${key}`;
    const ttl = await redisClient.ttl(redisKey);
    const current = await redisClient.incr(redisKey);

    if (ttl === -1 || ttl === -2) {
      await redisClient.expire(redisKey, windowSeconds);
    }

    return {
      ok: current <= limit,
      retryAfter: current <= limit ? 0 : windowSeconds,
    };
  } catch {
    return memoryFallback(key, limit, windowSeconds);
  }
}
