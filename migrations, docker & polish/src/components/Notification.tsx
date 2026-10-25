export type NotificationKind = "success" | "error" | "info";

interface NotificationProps {
  kind: NotificationKind;
  message: string;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
}

const STYLES: Record<NotificationKind, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

const ICONS: Record<NotificationKind, string> = {
  success: "✓",
  error: "⚠",
  info: "ℹ",
};

export function Notification({ kind, message, onDismiss, action }: NotificationProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${STYLES[kind]}`}
    >
      <span aria-hidden="true" className="mt-0.5 font-semibold">
        {ICONS[kind]}
      </span>
      <p className="flex-1 leading-relaxed">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="shrink-0 rounded-md border border-current/30 px-2.5 py-1 text-xs font-semibold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-md px-1.5 py-0.5 text-sm leading-none hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          ×
        </button>
      )}
    </div>
  );
}
