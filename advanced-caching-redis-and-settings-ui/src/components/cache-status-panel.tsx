"use client";

import { useCacheHealth } from "@/lib/use-cache-health";

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function CacheStatusPanel() {
  const health = useCacheHealth(8000);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatusCard
        title="Redis cache"
        state={health.state}
        latencyMs={health.redis?.latencyMs ?? null}
        checkedAt={health.lastCheckedAt}
        description={
          health.state === "available"
            ? "Redis responded to a health ping successfully. Tenant settings reads and writes use the cache."
            : health.state === "unavailable"
              ? "Redis could not be reached. ProjectHive is serving and persisting settings directly through PostgreSQL."
              : health.state === "checking"
                ? "Running an initial health check against the Redis instance."
                : "The last health check attempt did not complete. Status could not be confirmed."
        }
      />
      <StatusCard
        title="PostgreSQL database"
        state={health.database ? (health.database.status === "available" ? "available" : "unavailable") : "checking"}
        latencyMs={health.database?.latencyMs ?? null}
        checkedAt={health.lastCheckedAt}
        description={
          health.database?.status === "available"
            ? "The authoritative database is reachable. All tenant data operations are fully available."
            : health.database
              ? "The database could not be reached. Settings cannot be read or written until it recovers."
              : "Waiting for the first health check to complete."
        }
      />
    </div>
  );
}

function StatusCard({
  title,
  state,
  latencyMs,
  checkedAt,
  description,
}: {
  title: string;
  state: "available" | "unavailable" | "checking" | "unknown";
  latencyMs: number | null;
  checkedAt: string | null;
  description: string;
}) {
  const dot =
    state === "available"
      ? "bg-emerald-500"
      : state === "unavailable"
        ? "bg-amber-500"
        : "bg-slate-400 animate-pulse";
  const badge =
    state === "available"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30"
      : state === "unavailable"
        ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30"
        : "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700";
  const label = state === "available" ? "Available" : state === "unavailable" ? "Unavailable" : state === "checking" ? "Checking…" : "Unknown";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
        <div>
          <dt className="text-slate-400 dark:text-slate-500">Latency</dt>
          <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{latencyMs !== null ? `${latencyMs} ms` : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400 dark:text-slate-500">Last checked</dt>
          <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{formatTime(checkedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
