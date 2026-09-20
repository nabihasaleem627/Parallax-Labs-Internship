import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { withTenantScope } from "@/lib/db/tenant";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDaysIcon } from "@/components/ui/icons";
import { BookingStatusBadge } from "@/components/ui/badge";
import { formatTime, cn } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendar" };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);
  // Monday-first grid.
  const startOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  const bookings = await withTenantScope(user.tenantId, (tx) =>
    tx.booking.findMany({
      where: { startsAt: { gte: gridStart, lt: monthEnd }, status: { not: "CANCELLED" } },
      include: { user: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
    })
  );

  const cells: Date[] = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });

  const byDay = new Map<number, typeof bookings>();
  for (const booking of bookings) {
    const day = booking.startsAt.getDate();
    const list = byDay.get(day) ?? [];
    list.push(booking);
    byDay.set(day, list);
  }

  const todayKey = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your organization&rsquo;s bookings for {MONTH_NAMES[month]} {year}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              const inMonth = date.getMonth() === month;
              const isToday =
                date.getDate() === todayKey.getDate() &&
                date.getMonth() === todayKey.getMonth() &&
                date.getFullYear() === todayKey.getFullYear();
              const dayBookings = byDay.get(date.getDate()) ?? [];

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-16 rounded-lg border p-1.5 sm:min-h-20",
                    inMonth ? "border-slate-100 bg-white" : "border-transparent bg-slate-50/60",
                    isToday && "border-indigo-300 bg-indigo-50/40"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isToday
                        ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white"
                        : inMonth
                          ? "text-slate-600"
                          : "text-slate-300"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        title={booking.title}
                        className="truncate rounded bg-indigo-100/80 px-1 py-0.5 text-[10px] font-medium leading-tight text-indigo-800"
                      >
                        {booking.title}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="px-1 text-[10px] font-medium text-slate-400">
                        +{dayBookings.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">This month</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {bookings.length} active booking{bookings.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="p-5">
            {bookings.length === 0 ? (
              <EmptyState
                icon={<CalendarDaysIcon className="h-5 w-5" />}
                title="Nothing scheduled"
                description="Bookings created this month will be listed here."
              />
            ) : (
              <ul className="space-y-3">
                {bookings.map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{booking.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatTime(booking.startsAt)} · {booking.user.name}
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Foundation view for Week 1 — month navigation, drag-and-drop and conflict detection
        are scheduled for later weeks.
      </p>
    </div>
  );
}
