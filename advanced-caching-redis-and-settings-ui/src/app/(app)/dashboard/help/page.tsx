const FAQS = [
  {
    q: "How is my data isolated from other tenants?",
    a: "Every database query and cache key is scoped using the tenant id resolved from your authenticated session — never from client input. Projects, settings, and activity records all carry a tenant_id foreign key that is enforced on every read and write.",
  },
  {
    q: "What happens if Redis goes down?",
    a: "ProjectHive treats Redis purely as an optimization. If a cache operation fails or times out, the request transparently falls back to PostgreSQL. You will see a 'Database fallback' badge in the top bar and on the System Status page, but reads and writes keep working.",
  },
  {
    q: "How long are tenant settings cached?",
    a: "Cached settings expire after 5 minutes (TTL). Any successful save immediately invalidates and repopulates the cache entry so you never read stale data after an update.",
  },
  {
    q: "Who can change tenant settings?",
    a: "Workspace owners and admins can update settings. Members have read-only access to the settings page.",
  },
  {
    q: "Where can I see system health?",
    a: "Visit System Status in the sidebar for live Redis and database health, including latency and the last successful check.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Help & Documentation</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Answers to common questions about workspaces, caching, and settings.</p>
      </div>

      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {FAQS.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 marker:content-none dark:text-slate-200">
              <span className="flex items-center justify-between">
                {item.q}
                <span className="ml-3 text-slate-400 transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Need more help?</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Refer to the project README for full architecture notes, API documentation, and instructions for simulating
          a Redis outage locally.
        </p>
      </div>
    </div>
  );
}
