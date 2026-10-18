import Redis from "ioredis";

// Redis is treated strictly as an optimization layer. Every function in this
// module is defensive: connection issues must never throw into callers that
// only care about tenant settings. Callers should always have a database
// fallback path available.

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const CONNECT_TIMEOUT_MS = 2000;
const COMMAND_TIMEOUT_MS = 1500;
const MAX_RETRIES_PER_REQUEST = 1;
const MAX_RECONNECT_ATTEMPTS = 5;

type GlobalRedisState = typeof globalThis & {
  __projectHiveRedisClient?: Redis;
  __projectHiveRedisLastError?: { message: string; at: number };
};

const globalState = globalThis as GlobalRedisState;

function createClient(): Redis {
  const client = new Redis(REDIS_URL, {
    lazyConnect: true,
    connectTimeout: CONNECT_TIMEOUT_MS,
    commandTimeout: COMMAND_TIMEOUT_MS,
    maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > MAX_RECONNECT_ATTEMPTS) {
        // Stop retrying so we don't hammer a down service. The client can be
        // reconnected lazily the next time a command is issued.
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    reconnectOnError() {
      return false;
    },
  });

  client.on("error", (err: Error) => {
    globalState.__projectHiveRedisLastError = { message: err.message, at: Date.now() };
  });

  return client;
}

export function getRedisClient(): Redis {
  if (!globalState.__projectHiveRedisClient) {
    globalState.__projectHiveRedisClient = createClient();
  }
  return globalState.__projectHiveRedisClient;
}

async function ensureConnected(client: Redis): Promise<void> {
  if (client.status === "ready") return;
  if (client.status === "connecting" || client.status === "connect") {
    // Let the in-flight connection attempt resolve or fail.
    await new Promise<void>((resolve) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        resolve();
      };
      const cleanup = () => {
        client.off("ready", onReady);
        client.off("error", onError);
      };
      client.once("ready", onReady);
      client.once("error", onError);
    });
    return;
  }
  await client.connect().catch(() => {
    // Swallow: health/usage checks interpret client.status afterward.
  });
}

export type RedisHealthState = "available" | "unavailable";

export interface RedisHealth {
  status: RedisHealthState;
  latencyMs: number | null;
  checkedAt: string;
  lastError: string | null;
}

// Cache the health check briefly so the UI/dashboard can poll frequently
// without generating excessive PING traffic or reconnect storms.
const HEALTH_CACHE_MS = 2000;
let lastHealth: RedisHealth | null = null;

export async function checkRedisHealth(forceFresh = false): Promise<RedisHealth> {
  if (!forceFresh && lastHealth && Date.now() - new Date(lastHealth.checkedAt).getTime() < HEALTH_CACHE_MS) {
    return lastHealth;
  }

  const client = getRedisClient();
  const startedAt = Date.now();
  try {
    await ensureConnected(client);
    if (client.status !== "ready") {
      throw new Error(globalState.__projectHiveRedisLastError?.message || "Redis is not connected");
    }
    await client.ping();
    const result: RedisHealth = {
      status: "available",
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      lastError: null,
    };
    lastHealth = result;
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Redis error";
    const result: RedisHealth = {
      status: "unavailable",
      latencyMs: null,
      checkedAt: new Date().toISOString(),
      lastError: message,
    };
    lastHealth = result;
    return result;
  }
}

/**
 * Runs a Redis operation and safely returns `null` on any failure
 * (connection issue, timeout, command error) instead of throwing. This is
 * the core mechanism that keeps Redis an optimization rather than a
 * dependency for the request lifecycle.
 */
export async function safeRedisOp<T>(op: (client: Redis) => Promise<T>): Promise<T | null> {
  try {
    const client = getRedisClient();
    await ensureConnected(client);
    if (client.status !== "ready") {
      return null;
    }
    return await op(client);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Redis error";
    globalState.__projectHiveRedisLastError = { message, at: Date.now() };
    console.error("[redis] operation failed, falling back:", message);
    return null;
  }
}
