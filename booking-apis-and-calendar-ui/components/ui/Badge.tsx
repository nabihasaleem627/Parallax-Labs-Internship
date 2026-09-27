import React from "react";
import { BookingStatus } from "@prisma/client";
import { CheckCircle2, Clock, Check, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  status: BookingStatus | string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: BadgeProps) {
  const normalizedStatus = status.toUpperCase();

  switch (normalizedStatus) {
    case "CONFIRMED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
            className
          )}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          <span>Confirmed</span>
        </span>
      );

    case "PENDING":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
            className
          )}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          <span>Pending</span>
        </span>
      );

    case "COMPLETED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
            className
          )}
        >
          {showIcon && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          <span>Completed</span>
        </span>
      );

    case "CANCELLED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
            className
          )}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
          <span>Cancelled</span>
        </span>
      );

    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
            className
          )}
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-slate-500" />}
          <span>{status}</span>
        </span>
      );
  }
}
