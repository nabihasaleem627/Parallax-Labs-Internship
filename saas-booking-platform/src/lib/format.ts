/** Joins class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatTime(date: Date | string): string {
  return timeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function isUpcoming(date: Date): boolean {
  return date.getTime() >= Date.now() - 60 * 60 * 1000;
}
