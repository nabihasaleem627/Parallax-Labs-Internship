export function SettingsFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading settings">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-10 w-full rounded-lg bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="h-10 w-full rounded-lg bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="h-10 w-full rounded-lg bg-slate-200" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-40 rounded bg-slate-200" />
        <div className="h-8 w-full rounded-lg bg-slate-200" />
        <div className="h-8 w-full rounded-lg bg-slate-200" />
        <div className="h-8 w-full rounded-lg bg-slate-200" />
      </div>
      <div className="h-10 w-32 rounded-lg bg-slate-300" />
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
