import { db } from "@/db";
import { sql } from "drizzle-orm";
import { isRedisAvailable } from "@/lib/redis";

export const dynamic = "force-dynamic";

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export default async function StatusPage() {
  let databaseOk = false;
  let databaseLatencyMs: number | null = null;
  try {
    const start = Date.now();
    await db.execute(sql`select 1`);
    databaseLatencyMs = Date.now() - start;
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const redisStart = Date.now();
  const redisOk = await isRedisAvailable();
  const redisLatencyMs = Date.now() - redisStart;

  const overall = databaseOk ? (redisOk ? "All systems operational" : "Degraded (cache unavailable)") : "Unavailable";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-semibold text-slate-900">System status</h1>
      <p className="mt-1 text-sm text-slate-600">
        Live readiness snapshot. Matches the data returned by{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5">/api/health/ready</code>.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <span className="text-sm font-semibold text-slate-700">Overall</span>
          <StatusPill ok={databaseOk} label={overall} />
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">PostgreSQL</p>
              <p className="text-xs text-slate-500">
                Critical dependency &mdash; settings cannot be served if this is down.
                {databaseLatencyMs !== null && ` Responded in ${databaseLatencyMs}ms.`}
              </p>
            </div>
            <StatusPill ok={databaseOk} label={databaseOk ? "Connected" : "Unreachable"} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Redis cache</p>
              <p className="text-xs text-slate-500">
                Optional &mdash; the app automatically falls back to PostgreSQL when unavailable. Responded in{" "}
                {redisLatencyMs}ms.
              </p>
            </div>
            <StatusPill ok={redisOk} label={redisOk ? "Connected" : "Unavailable (fallback active)"} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href="/api/health/live"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
        >
          View liveness endpoint
          <span className="mt-1 block text-xs font-normal text-slate-500">/api/health/live</span>
        </a>
        <a
          href="/api/health/ready"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
        >
          View readiness endpoint
          <span className="mt-1 block text-xs font-normal text-slate-500">/api/health/ready</span>
        </a>
      </div>
    </div>
  );
}
