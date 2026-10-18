import { CacheStatusPanel } from "@/components/cache-status-panel";

export const dynamic = "force-dynamic";

export default function SystemStatusPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">System Status</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Live health checks for the Redis cache and PostgreSQL database. This page polls a dedicated health endpoint
          every few seconds — it never infers cache health from settings API responses.
        </p>
      </div>

      <CacheStatusPanel />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">How caching works here</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          <li>Tenant settings reads first check a tenant-scoped Redis key (<code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">projecthive:tenant:&#123;id&#125;:settings</code>).</li>
          <li>On a cache miss, the database is read and the result repopulates Redis with a 5 minute TTL.</li>
          <li>Successful settings updates always write to PostgreSQL first, then invalidate and refresh the cache entry.</li>
          <li>If Redis is unreachable at any point, every operation falls back to PostgreSQL directly and the UI shows a non-blocking notice.</li>
          <li>Redis commands use short connect/command timeouts and a bounded retry strategy so an outage never blocks requests for long.</li>
        </ol>
      </section>
    </div>
  );
}
