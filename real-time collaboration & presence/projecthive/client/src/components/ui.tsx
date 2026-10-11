import { useEffect, type ReactNode } from 'react';
import { initials } from '../utils/format';
import { XIcon } from './Icons';

/* ---------------------------------- Avatar ---------------------------------- */

interface AvatarProps {
  name: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  online?: boolean | null;
  title?: string;
  className?: string;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function Avatar({ name, color, size = 'sm', online, title, className = '' }: AvatarProps) {
  return (
    <span className={`relative inline-flex flex-shrink-0 ${className}`} title={title}>
      <span
        className={`${sizeMap[size]} inline-flex items-center justify-center rounded-full font-bold text-white ring-2 ring-white`}
        style={{ backgroundColor: color }}
        aria-label={name}
      >
        {initials(name)}
      </span>
      {online !== null && online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </span>
  );
}

export interface StackMember {
  userId: string;
  name: string;
  role: string;
  avatarColor: string;
  activity: string;
  online: boolean;
}

/** Overlapping avatar stack with hover tooltips (name / role / current activity). */
export function AvatarStack({ members, max = 5 }: { members: StackMember[]; max?: number }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <span key={m.userId} className="group relative">
            <Avatar name={m.name} color={m.avatarColor} size="sm" online={m.online} />
            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-44 -translate-x-1/2 rounded-lg bg-navy-900 px-3 py-2 text-left text-xs text-white shadow-pop group-hover:block">
              <span className="block font-semibold">{m.name}</span>
              <span className="block capitalize text-slate-300">{m.role}</span>
              <span className="mt-0.5 block text-indigo-300">{m.activity}</span>
            </span>
          </span>
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 ring-2 ring-white">
          +{extra}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------- Badges ---------------------------------- */

const badgeTones: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  navy: 'bg-navy-800 text-white ring-navy-800',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export function Badge({ tone = 'slate', children, className = '' }: { tone?: keyof typeof badgeTones | string; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badgeTones[tone] ?? badgeTones.slate} ${className}`}>
      {children}
    </span>
  );
}

export const statusTone: Record<string, string> = {
  active: 'green',
  completed: 'indigo',
  'on-hold': 'amber',
  pending: 'amber',
  backlog: 'slate',
  todo: 'sky',
  'in-progress': 'amber',
  review: 'indigo',
  high: 'red',
  medium: 'amber',
  low: 'slate',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? 'slate'}>{status.replace('-', ' ')}</Badge>;
}

/* --------------------------------- Progress --------------------------------- */

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

/* ---------------------------------- Modal ----------------------------------- */

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`max-h-[92vh] w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} animate-fade-in overflow-y-auto rounded-t-2xl bg-white shadow-pop sm:rounded-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h3 className="text-base font-bold text-navy-900">{title}</h3>
          <button onClick={onClose} className="btn-ghost !px-2 !py-1" aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------ Loading states ------------------------------ */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
    </div>
  );
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className={`grid gap-4 ${rows > 1 ? 'sm:grid-cols-2 xl:grid-cols-3' : ''}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">{icon}</div>}
      <h3 className="text-base font-bold text-navy-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-rose-700">{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
