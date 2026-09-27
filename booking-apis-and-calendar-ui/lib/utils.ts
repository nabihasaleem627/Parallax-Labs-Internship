import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Combines a date string (YYYY-MM-DD) and a 24h time string (HH:MM) into a valid UTC/Local Date object.
 */
export function buildDateTime(dateStr: string | Date, timeStr: string): Date {
  const baseDate = typeof dateStr === "string" ? new Date(dateStr) : new Date(dateStr);
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function formatDateSafe(date: string | Date | null | undefined, pattern: string = "MMM d, yyyy"): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "—";
    return format(d, pattern);
  } catch {
    return "—";
  }
}

export function formatTime12h(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24;
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12; // hour '0' should be '12'
  return `${h}:${m} ${ampm}`;
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generates an idempotency key (UUID v4 format) on the client side
 */
export function generateClientUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
