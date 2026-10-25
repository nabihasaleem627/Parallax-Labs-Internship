import Redis from "ioredis";

/**
 * Redis is an optional performance optimization, never a hard dependency.
 * Every function here is defensive: if Redis is unreachable/misconfigured,
 * callers get `null`/`false` back instead of a thrown error, so the rest of
 * the application can always fall back to PostgreSQL (the source of truth).
 */

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const CONNECT_TIMEOUT_MS = 1500;
const COMMAND_TIMEOUT_MS = 750;

const globalForRedis = globalThis as typeof globalThis & {
  __arenaRedisClient?: Redis;
};

function createClient(): Redis {
  const client = new Redis(REDIS_URL, {
    connectTimeout: CONNECT_TIMEOUT_MS,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    retryStrategy(times) {
      // Cap backoff so a dead Redis doesn't spam reconnect attempts forever,
      // but still eventually recovers once Redis comes back.
      return Math.min(times * 500, 5000);
    },
    reconnectOnError: () => true,
  });

  client.on("error", (err) => {
    // Swallow + log; never let an unhandled Redis error crash the process.
    console.warn(`[redis] connection error: ${err.message}`);
  });

  return client;
}

export const redis = globalForRedis.__arenaRedisClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.__arenaRedisClient = redis;
}

let connectionPromise: Promise<void> | null = null;

async function ensureConnected(): Promise<boolean> {
  const currentStatus: string = redis.status;
  if (currentStatus === "ready") return true;

  if (!connectionPromise) {
    connectionPromise = redis
      .connect()
      .catch((err) => {
        console.warn(`[redis] failed to connect: ${(err as Error).message}`);
      })
      .finally(() => {
        connectionPromise = null;
      });
  }
  try {
    await Promise.race([
      connectionPromise,
      new Promise((resolve) => setTimeout(resolve, CONNECT_TIMEOUT_MS)),
    ]);
  } catch {
    // ignore - status check below reports reality
  }
  const finalStatus: string = redis.status;
  return finalStatus === "ready";
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("redis command timed out")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const connected = await ensureConnected();
    if (!connected) return false;
    const pong = await withTimeout(redis.ping(), COMMAND_TIMEOUT_MS);
    return pong === "PONG";
  } catch {
    return false;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const connected = await ensureConnected();
    if (!connected) return null;
    const raw = await withTimeout(redis.get(key), COMMAND_TIMEOUT_MS);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[redis] GET ${key} failed: ${(err as Error).message}`);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
  try {
    const connected = await ensureConnected();
    if (!connected) return false;
    await withTimeout(redis.set(key, JSON.stringify(value), "EX", ttlSeconds), COMMAND_TIMEOUT_MS);
    return true;
  } catch (err) {
    console.warn(`[redis] SET ${key} failed: ${(err as Error).message}`);
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const connected = await ensureConnected();
    if (!connected) return false;
    await withTimeout(redis.del(key), COMMAND_TIMEOUT_MS);
    return true;
  } catch (err) {
    console.warn(`[redis] DEL ${key} failed: ${(err as Error).message}`);
    return false;
  }
}
