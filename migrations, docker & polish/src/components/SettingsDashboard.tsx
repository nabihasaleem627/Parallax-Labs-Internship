"use client";

import { useCallback, useEffect, useState } from "react";
import { CacheBadge } from "@/components/CacheBadge";
import { Notification } from "@/components/Notification";
import { SettingsFormSkeleton } from "@/components/Skeleton";
import { SettingsForm, type SettingsFormValues } from "@/components/SettingsForm";
import { TenantConnectCard, type TenantAuth } from "@/components/TenantConnectCard";
import type { ApiErrorResponse, CacheSource, SettingsApiResponse } from "@/types/settings";

const STORAGE_KEY = "parallax.tenantAuth";

type LoadState = "idle" | "loading" | "loaded" | "not-found" | "unauthorized" | "network-error";

async function parseJsonSafely(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function SettingsDashboard() {
  const [auth, setAuth] = useState<TenantAuth | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [data, setData] = useState<SettingsApiResponse | null>(null);
  const [cacheSource, setCacheSource] = useState<CacheSource | null>(null);

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  // Restore a previously connected tenant from localStorage for convenience
  // across page reloads. This is a demo convenience, not a security
  // mechanism - the server still re-validates the API key on every request.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setAuth(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, []);

  const loadSettings = useCallback(async (tenantAuth: TenantAuth) => {
    setLoadState("loading");
    setFieldErrors(null);
    try {
      const res = await fetch(`/api/tenants/${encodeURIComponent(tenantAuth.slug)}/settings`, {
        headers: { "x-api-key": tenantAuth.apiKey },
        cache: "no-store",
      });

      if (res.status === 401) {
        setLoadState("unauthorized");
        return;
      }
      if (res.status === 404) {
        setLoadState("not-found");
        return;
      }
      if (!res.ok) {
        setLoadState("network-error");
        return;
      }

      const json = (await res.json()) as SettingsApiResponse;
      setData(json);
      setCacheSource(json.cache.source);
      setLoadState("loaded");
    } catch {
      setLoadState("network-error");
    }
  }, []);

  useEffect(() => {
    if (auth) void loadSettings(auth);
  }, [auth, loadSettings]);

  async function handleConnect(tenantAuth: TenantAuth) {
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await fetch(`/api/tenants/${encodeURIComponent(tenantAuth.slug)}/settings`, {
        headers: { "x-api-key": tenantAuth.apiKey },
        cache: "no-store",
      });

      if (res.status === 401) {
        setConnectError("That tenant slug and API key combination was not recognized.");
        return;
      }
      if (res.status === 404) {
        setConnectError("No settings exist for that tenant yet.");
        return;
      }
      if (!res.ok) {
        setConnectError("Could not reach the server. Please try again.");
        return;
      }

      const json = (await res.json()) as SettingsApiResponse;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tenantAuth));
      setAuth(tenantAuth);
      setData(json);
      setCacheSource(json.cache.source);
      setLoadState("loaded");
    } catch {
      setConnectError("Network error - please check your connection and try again.");
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    window.localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
    setData(null);
    setLoadState("idle");
    setBanner(null);
  }

  async function handleSave(values: SettingsFormValues) {
    if (!auth) return;
    setSaving(true);
    setFieldErrors(null);
    setBanner(null);
    try {
      const res = await fetch(`/api/tenants/${encodeURIComponent(auth.slug)}/settings`, {
        method: "PATCH",
        headers: { "x-api-key": auth.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await parseJsonSafely(res);

      if (res.status === 401) {
        setBanner({ kind: "error", message: "Your session is no longer valid. Please reconnect." });
        handleDisconnect();
        return;
      }
      if (res.status === 400) {
        const err = json as ApiErrorResponse | null;
        setFieldErrors((err?.details as { fieldErrors?: Record<string, string[]> })?.fieldErrors ?? null);
        setBanner({ kind: "error", message: err?.error ?? "Please fix the highlighted fields." });
        return;
      }
      if (!res.ok) {
        setBanner({ kind: "error", message: "Could not save settings. Please try again." });
        return;
      }

      const ok = json as SettingsApiResponse;
      setData(ok);
      setCacheSource(ok.cache.source);
      setBanner({ kind: "success", message: "Settings saved and cache refreshed." });
    } catch {
      setBanner({ kind: "error", message: "Network error while saving. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="flex justify-center px-4 py-10 sm:py-16">
        <TenantConnectCard onConnect={handleConnect} error={connectError} connecting={connecting} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant</p>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {data?.tenant.name ?? auth.slug}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <CacheBadge source={cacheSource} />
          <button
            type="button"
            onClick={() => loadSettings(auth)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Disconnect
          </button>
        </div>
      </div>

      {banner && (
        <div className="mb-5">
          <Notification kind={banner.kind} message={banner.message} onDismiss={() => setBanner(null)} />
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {loadState === "loading" && <SettingsFormSkeleton />}

        {loadState === "unauthorized" && (
          <Notification
            kind="error"
            message="Your API key was rejected. Please reconnect with valid credentials."
            action={{ label: "Reconnect", onClick: handleDisconnect }}
          />
        )}

        {loadState === "not-found" && (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-slate-700">No settings found for this tenant.</p>
            <p className="mt-1 text-sm text-slate-500">
              This tenant may not have been provisioned yet. Contact an administrator or try another tenant.
            </p>
            <button
              type="button"
              onClick={handleDisconnect}
              className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Choose a different tenant
            </button>
          </div>
        )}

        {loadState === "network-error" && (
          <Notification
            kind="error"
            message="Could not reach the server to load settings."
            action={{ label: "Retry", onClick: () => loadSettings(auth) }}
          />
        )}

        {loadState === "loaded" && data && (
          <SettingsForm settings={data.settings} saving={saving} fieldErrors={fieldErrors} onSave={handleSave} />
        )}
      </div>
    </div>
  );
}
