import { useEffect, useState, type ReactNode } from 'react';
import type { ConflictInfo, SaveStatus } from '../types';
import { relativeTime } from '../utils/format';
import { AlertIcon, CheckIcon, CloudCheckIcon, RefreshIcon, WifiOffIcon } from './Icons';
import { Modal } from './ui';

/* ------------------------------ Save status chip ----------------------------- */

export function SaveStatusIndicator({ status, lastSavedAt }: { status: SaveStatus; lastSavedAt: string | null }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => forceTick((t) => t + 1), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const config: Record<SaveStatus, { icon: ReactNode; label: string; className: string }> = {
    saved: {
      icon: <CheckIcon size={13} />,
      label: lastSavedAt ? `Saved ${relativeTime(lastSavedAt)}` : 'Saved',
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    saving: { icon: <Spinner />, label: 'Saving…', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
    syncing: { icon: <Spinner />, label: 'Syncing…', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
    offline: { icon: <WifiOffIcon size={13} />, label: 'Offline', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
    pending: { icon: <WifiOffIcon size={13} />, label: 'Offline · Changes pending', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
    conflict: { icon: <AlertIcon size={13} />, label: 'Conflict — action required', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
    loading: { icon: <Spinner />, label: 'Loading…', className: 'bg-slate-100 text-slate-500 ring-slate-200' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${c.className}`} role="status" aria-live="polite">
      {c.icon}
      {c.label}
    </span>
  );
}

function Spinner() {
  return <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />;
}

/* ------------------------------ Typing indicator ----------------------------- */

export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return <div className="h-6" aria-hidden />;
  const first = names[0]!.split(' ')[0];
  const label = names.length === 1 ? `${first} is typing` : names.length === 2 ? `${first} and ${names[1]!.split(' ')[0]} are typing` : `${names.length} people are typing`;
  return (
    <div className="flex h-6 items-center gap-2 text-xs font-medium text-slate-500" role="status" aria-live="polite">
      <span className="flex items-end gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-indigo-400" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </span>
      {label}
      <span className="text-slate-300">…</span>
    </div>
  );
}

/* -------------------------------- Offline banner ----------------------------- */

export function OfflineBanner({ show, message }: { show: boolean; message?: string }) {
  if (!show) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm" role="alert">
      <WifiOffIcon size={15} />
      {message ?? "You're offline. Your changes will be synchronized when you're back online."}
    </div>
  );
}

/* ---------------------------- Connection state banner ------------------------ */

export function ConnectionBanner({ banner, onRetry }: { banner: { kind: 'restored' | 'syncing' | 'synced' | 'offline' | null; at: number }; onRetry?: () => void }) {
  if (!banner.kind) return null;
  const map = {
    restored: { text: 'Connection restored', cls: 'bg-sky-600' },
    syncing: { text: 'Synchronizing changes…', cls: 'bg-sky-600' },
    synced: { text: 'All changes synchronized', cls: 'bg-emerald-600' },
    offline: { text: 'Connection lost — reconnecting…', cls: 'bg-amber-500' },
  } as const;
  const item = map[banner.kind];
  return (
    <div className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold text-white ${item.cls}`} role="status" aria-live="polite">
      {banner.kind === 'synced' ? <CloudCheckIcon size={14} /> : banner.kind === 'syncing' ? <RefreshIcon size={14} className="animate-spin" /> : null}
      {item.text}
      {banner.kind === 'offline' && onRetry && (
        <button onClick={onRetry} className="ml-1 rounded bg-white/20 px-2 py-0.5 text-[11px] hover:bg-white/30">
          Retry now
        </button>
      )}
    </div>
  );
}

/* ------------------------------- Conflict dialog ----------------------------- */

export function ConflictDialog({
  conflict,
  localDraft,
  onLoadLatest,
  onKeepMine,
  onClose,
}: {
  conflict: ConflictInfo;
  localDraft: string;
  onLoadLatest: () => void;
  onKeepMine: () => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<'notice' | 'review'>('notice');
  return (
    <Modal open title="Conflict Detected" onClose={onClose} wide={view === 'review'}>
      {view === 'notice' ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
            <AlertIcon size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">This document was changed by another team member while you were editing.</p>
              <p className="mt-1 text-amber-800">
                {conflict.serverUpdatedByName} saved version {conflict.serverVersion} {relativeTime(conflict.serverUpdatedAt)}. Your draft is based on version {conflict.yourVersion}. Nothing has been overwritten.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn-secondary flex-1" onClick={() => setView('review')}>
              Review Changes
            </button>
            <button className="btn-secondary flex-1" onClick={onLoadLatest}>
              Load Latest Version
            </button>
            <button className="btn-primary flex-1" onClick={onKeepMine}>
              Keep My Draft
            </button>
          </div>
          <p className="text-xs text-slate-400">
            “Keep My Draft” re-applies your changes on top of the latest version. “Load Latest Version” discards your local draft.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-600">Your draft (v{conflict.yourVersion})</p>
              <div className="doc-content max-h-72 overflow-y-auto rounded-lg border border-indigo-200 bg-indigo-50/40 px-4 py-3 text-sm" dangerouslySetInnerHTML={{ __html: localDraft }} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-emerald-600">Latest on server (v{conflict.serverVersion})</p>
              <div className="doc-content max-h-72 overflow-y-auto rounded-lg border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-sm" dangerouslySetInnerHTML={{ __html: conflict.serverContent }} />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn-secondary flex-1" onClick={() => setView('notice')}>
              Back
            </button>
            <button className="btn-secondary flex-1" onClick={onLoadLatest}>
              Load Latest Version
            </button>
            <button className="btn-primary flex-1" onClick={onKeepMine}>
              Keep My Draft
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
