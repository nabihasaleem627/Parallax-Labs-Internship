import { cn } from "@/lib/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white",
        className ?? "h-8 w-8"
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[62%] w-[62%]"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    </span>
  );
}

export function Brand({ withText = true, className }: { withText?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {withText && (
        <span className="text-lg font-semibold tracking-tight text-slate-900">Bookflow</span>
      )}
    </span>
  );
}
