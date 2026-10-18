import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "Multi-tenant workspaces",
    body: "Every workspace is isolated at the database layer. Sessions, projects, and settings are always scoped to the authenticated tenant.",
  },
  {
    title: "Redis-backed settings cache",
    body: "Tenant settings are read through a cache-aside layer with tenant-scoped keys, a 5 minute TTL, and automatic invalidation on save.",
  },
  {
    title: "Graceful degradation",
    body: "If Redis is unreachable, ProjectHive falls back to PostgreSQL transparently — reads and writes keep working without user disruption.",
  },
  {
    title: "Transparent system status",
    body: "A dedicated status page reports live cache and database health so your team always knows where data is coming from.",
  },
];

export default async function LandingPage() {
  const auth = await getCurrentAuth();
  if (auth) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">PH</div>
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">ProjectHive</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="rounded-lg px-3 py-2 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            Create workspace
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-10 pt-16 text-center">
        <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Parallax Labs Internship — Week 5
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
          A multi-tenant workspace platform with reliable caching.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          ProjectHive gives every tenant an isolated workspace, projects, and settings — backed by a Redis cache that
          never becomes a single point of failure.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
