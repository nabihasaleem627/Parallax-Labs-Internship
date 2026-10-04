import { useEffect, type ReactNode } from 'react';
import { Icon } from './Icons';

export function Spinner({ dark = false }: { dark?: boolean }) {
  return <span className={`h-4 w-4 animate-spin rounded-full border-2 ${dark ? 'border-slate-300 border-t-ink-900' : 'border-white/40 border-t-white'}`} aria-hidden="true" />;
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const classes = key === 'active' || key === 'paid' || key === 'confirmed'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
    : key === 'past_due' || key === 'failed' || key === 'unpaid' || key === 'cancelled'
      ? 'bg-red-50 text-red-700 ring-red-600/15'
      : key === 'canceled' ? 'bg-slate-100 text-slate-700 ring-slate-500/15'
        : 'bg-amber-50 text-amber-700 ring-amber-600/15';
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">{title}</h1><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div>{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center"><span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="billing" /></span><h3 className="font-semibold text-ink-900">{title}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-5"><div className="flex gap-3"><span className="mt-0.5 text-red-600"><Icon name="warning" size={19} /></span><div><p className="text-sm font-semibold text-red-900">We couldn’t load this information</p><p className="mt-1 text-sm text-red-700">{message}</p>{onRetry && <button className="mt-3 text-sm font-semibold text-red-800 underline underline-offset-4" onClick={onRetry}>Try again</button>}</div></div></div>;
}

export function ConfirmDialog({ open, title, description, confirmLabel, destructive = false, loading = false, onCancel, onConfirm }: { open: boolean; title: string; description: string; confirmLabel: string; destructive?: boolean; loading?: boolean; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handle = (event: KeyboardEvent) => event.key === 'Escape' && onCancel();
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onCancel]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-ink-950/50 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${destructive ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}><Icon name={destructive ? 'warning' : 'billing'} size={20}/></div>
      <h2 id="dialog-title" className="text-lg font-bold text-ink-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={onCancel} disabled={loading}>Keep plan</button><button className={destructive ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>{loading && <Spinner />}{confirmLabel}</button></div>
    </div>
  </div>;
}

export function Progress({ value }: { value: number }) {
  return <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}
