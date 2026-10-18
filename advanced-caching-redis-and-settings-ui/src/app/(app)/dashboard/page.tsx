import Link from "next/link";
import { getCurrentAuth } from "@/lib/auth";
import { getWorkspaceOverview } from "@/lib/overview";
import { CacheStatusBadge } from "@/components/cache-status-badge";

export const dynamic = "force-dynamic";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const ACTION_LABELS: Record<string, string> = {
  workspace_created: "Workspace created",
  tenant_settings_updated: "Tenant settings updated",
  project_created: "Project created",
};

export default async function OverviewPage() {
  const auth = await getCurrentAuth();
  if (!auth) return null;

  const overview = await getWorkspaceOverview(auth.tenant.id, auth.tenant.name, auth.tenant.slug);
  const { settings } = overview.settings;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Workspace</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{overview.tenant.name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {overview.memberCount} member{overview.memberCount === 1 ? "" : "s"} · slug <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">{overview.tenant.slug}</code>
            </p>
          </div>
          <CacheStatusBadge />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active projects" value={overview.projectCounts.active} />
        <StatCard label="On hold" value={overview.projectCounts.onHold} />
        <StatCard label="Completed" value={overview.projectCounts.completed} />
        <StatCard label="Total projects" value={overview.projectCounts.total} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent activity</h3>
            <Link href="/dashboard/projects" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              View projects
            </Link>
          </div>
          {overview.recentActivity.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet. Actions in your workspace will show up here.</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {overview.recentActivity.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{ACTION_LABELS[item.action] ?? item.action}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.actorName ?? "System"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatRelativeTime(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tenant settings summary</h3>
            <Link href="/dashboard/settings" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              Edit
            </Link>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Time zone" value={settings.timezone} />
            <Row label="Locale" value={settings.locale} />
            <Row label="Theme preference" value={settings.theme} />
            <Row label="Density" value={settings.density} />
            <Row label="Settings source" value={overview.settings.source === "cache" ? "Redis cache" : "Database"} />
            <Row label="Last saved" value={new Date(settings.updatedAt).toLocaleString()} />
          </dl>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium capitalize text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}
