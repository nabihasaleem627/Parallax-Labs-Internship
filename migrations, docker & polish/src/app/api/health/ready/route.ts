import { db } from "@/db";
import { isRedisAvailable } from "@/lib/redis";
import { sql } from "drizzle-orm";

/**
 * Readiness probe: answers "can this instance currently serve real
 * traffic?". PostgreSQL connectivity is CRITICAL - if it's down we return
 * 503 because settings cannot be read/written at all. Redis connectivity is
 * OPTIONAL - if it's down we still return 200 (degraded) because the
 * application transparently falls back to PostgreSQL for every read/write.
 *
 * No credentials, connection strings, or stack traces are included in the
 * response body.
 */
export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export async function GET() {
  let databaseOk = false;
  try {
    await withTimeout(db.execute(sql`select 1`), DB_TIMEOUT_MS);
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const redisOk = await isRedisAvailable();

  const body = {
    status: databaseOk ? (redisOk ? "ok" : "degraded") : "unavailable",
    checks: {
      database: { ok: databaseOk, critical: true },
      cache: { ok: redisOk, critical: false, note: "falls back to database when unavailable" },
    },
  };

  // 200 when the app can serve traffic (even if the cache is degraded),
  // 503 only when the critical dependency (the database) is unreachable.
  return Response.json(body, { status: databaseOk ? 200 : 503 });
}
