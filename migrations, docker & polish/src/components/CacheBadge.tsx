import type { CacheSource } from "@/types/settings";

export function CacheBadge({ source }: { source: CacheSource | null }) {
  if (!source) return null;

  const isHit = source === "cache";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        isHit
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
      role="status"
      aria-label={isHit ? "Served from Redis cache" : "Served from database"}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isHit ? "bg-emerald-500" : "bg-amber-500"}`}
        aria-hidden="true"
      />
      {isHit ? "Cache hit" : "Database"}
    </span>
  );
}
