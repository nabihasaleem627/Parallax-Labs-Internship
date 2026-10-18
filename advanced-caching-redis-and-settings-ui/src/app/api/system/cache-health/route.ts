import { getCurrentAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { checkRedisHealth } from "@/lib/redis";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) {
    return apiError("Not authenticated", 401);
  }

  const redis = await checkRedisHealth();

  let database: { status: "available" | "unavailable"; latencyMs: number | null } = {
    status: "unavailable",
    latencyMs: null,
  };
  const dbStart = Date.now();
  try {
    await db.execute(sql`select 1`);
    database = { status: "available", latencyMs: Date.now() - dbStart };
  } catch (err) {
    console.error("[health] database check failed", err instanceof Error ? err.message : err);
  }

  return apiOk({
    redis: {
      status: redis.status,
      latencyMs: redis.latencyMs,
      checkedAt: redis.checkedAt,
      degraded: redis.status !== "available",
    },
    database,
  });
}
