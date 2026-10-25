"use client";

import { useEffect, useState } from "react";
import { Notification } from "@/components/Notification";

export interface TenantAuth {
  slug: string;
  apiKey: string;
}

interface DemoTenant {
  slug: string;
  name: string;
  apiKey: string;
}

export function TenantConnectCard({
  onConnect,
  error,
  connecting,
}: {
  onConnect: (auth: TenantAuth) => void;
  error: string | null;
  connecting: boolean;
}) {
  const [slug, setSlug] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [demoTenants, setDemoTenants] = useState<DemoTenant[]>([]);
  const [demoLoading, setDemoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tenants/demo")
      .then((res) => (res.ok ? res.json() : { demoTenants: [] }))
      .then((data) => {
        if (!cancelled) setDemoTenants(data.demoTenants ?? []);
      })
      .catch(() => {
        if (!cancelled) setDemoTenants([]);
      })
      .finally(() => {
        if (!cancelled) setDemoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !apiKey.trim()) {
      setFieldError("Both tenant slug and API key are required.");
      return;
    }
    setFieldError(null);
    onConnect({ slug: slug.trim(), apiKey: apiKey.trim() });
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Connect to your tenant</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        Enter your tenant slug and API key to view and manage settings.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="tenant-slug" className="block text-sm font-medium text-slate-700">
            Tenant slug
          </label>
          <input
            id="tenant-slug"
            name="tenant-slug"
            type="text"
            autoComplete="off"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. acme"
            className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div>
          <label htmlFor="tenant-api-key" className="block text-sm font-medium text-slate-700">
            API key
          </label>
          <input
            id="tenant-api-key"
            name="tenant-api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your tenant API key"
            className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {fieldError && (
          <p role="alert" className="text-sm font-medium text-rose-600">
            {fieldError}
          </p>
        )}
        {error && <Notification kind="error" message={error} />}

        <button
          type="submit"
          disabled={connecting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connecting ? "Connecting…" : "Connect"}
        </button>
      </form>

      <div className="mt-8 border-t border-dashed border-slate-200 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Demo tenants (local seed data, dev only)
        </p>
        {demoLoading ? (
          <div className="mt-3 h-16 animate-pulse rounded-lg bg-slate-100" />
        ) : demoTenants.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No demo tenants found. Run <code className="rounded bg-slate-100 px-1 py-0.5">npm run db:seed</code> to
            generate some.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {demoTenants.map((tenant) => (
              <li key={tenant.slug}>
                <button
                  type="button"
                  onClick={() => onConnect({ slug: tenant.slug, apiKey: tenant.apiKey })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {tenant.name}
                  <span className="block text-xs font-normal text-slate-500">slug: {tenant.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
