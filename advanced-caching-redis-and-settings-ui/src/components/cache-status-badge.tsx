"use client";

import { useCacheHealth } from "@/lib/use-cache-health";

const STATE_STYLES: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  unavailable: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  checking: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  unknown: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

const STATE_LABEL: Record<string, string> = {
  available: "Cache available",
  unavailable: "Database fallback",
  checking: "Checking cache…",
  unknown: "Status unknown",
};

export function CacheStatusBadge({ compact = false }: { compact?: boolean }) {
  const health = useCacheHealth();
  const style = STATE_STYLES[health.state];
  const label = STATE_LABEL[health.state];

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}
      title={
        health.state === "unavailable"
          ? "Redis is unreachable. Settings are served directly from PostgreSQL."
          : health.state === "unknown"
            ? "Unable to verify cache health right now."
            : "Redis is connected and serving cached tenant settings."
      }
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          health.state === "available"
            ? "bg-emerald-500"
            : health.state === "unavailable"
              ? "bg-amber-500"
              : "bg-slate-400 animate-pulse"
        }`}
      />
      {!compact && label}
      {compact && <span className="hidden sm:inline">{label}</span>}
    </div>
  );
}
