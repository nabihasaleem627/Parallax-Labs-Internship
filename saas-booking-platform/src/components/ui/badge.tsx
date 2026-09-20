import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import type { BookingStatus, UserRole } from "@prisma/client";

type Tone = "slate" | "indigo" | "emerald" | "amber" | "rose";

const toneClasses: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const bookingStatusConfig: Record<BookingStatus, { tone: Tone; label: string }> = {
  PENDING: { tone: "amber", label: "Pending" },
  CONFIRMED: { tone: "emerald", label: "Confirmed" },
  CANCELLED: { tone: "rose", label: "Cancelled" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { tone, label } = bookingStatusConfig[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const roleConfig: Record<UserRole, { tone: Tone; label: string }> = {
  ORG_ADMIN: { tone: "indigo", label: "Org Admin" },
  STAFF: { tone: "emerald", label: "Staff" },
  USER: { tone: "slate", label: "Member" },
};

export function RoleBadge({ role }: { role: UserRole }) {
  const { tone, label } = roleConfig[role];
  return <Badge tone={tone}>{label}</Badge>;
}
