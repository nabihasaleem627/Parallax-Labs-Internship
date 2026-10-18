"use client";

import { useEffect, useRef, useState } from "react";

export type CacheHealthState = "checking" | "available" | "unavailable" | "unknown";

export interface CacheHealthData {
  redis: { status: "available" | "unavailable"; latencyMs: number | null; checkedAt: string; degraded: boolean } | null;
  database: { status: "available" | "unavailable"; latencyMs: number | null } | null;
  state: CacheHealthState;
  lastCheckedAt: string | null;
}

const POLL_INTERVAL_MS = 15000;

export function useCacheHealth(pollIntervalMs: number = POLL_INTERVAL_MS) {
  const [data, setData] = useState<CacheHealthData>({
    redis: null,
    database: null,
    state: "checking",
    lastCheckedAt: null,
  });
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const res = await fetch("/api/system/cache-health", { cache: "no-store" });
        if (!res.ok) throw new Error("request failed");
        const json = await res.json();
        if (cancelled) return;
        setData({
          redis: json.redis,
          database: json.database,
          state: json.redis?.status === "available" ? "available" : "unavailable",
          lastCheckedAt: new Date().toISOString(),
        });
      } catch {
        if (cancelled) return;
        setData((prev) => ({ ...prev, state: "unknown", lastCheckedAt: new Date().toISOString() }));
      } finally {
        inFlight.current = false;
      }
    }

    poll();
    const id = setInterval(poll, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollIntervalMs]);

  return data;
}
