import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type Tone = "error" | "success" | "info";

const toneClasses: Record<Tone, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-4 py-3 text-sm", toneClasses[tone], className)}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && "mt-1")}>{children}</div>}
    </div>
  );
}
