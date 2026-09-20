import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { withTenantScope } from "@/lib/db/tenant";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarIcon, CheckIcon } from "@/components/ui/icons";
import { BookingStatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

const gettingStarted = [
  { label: "Browse and manage bookings", href: "/dashboard/bookings" },
  { label: "Review the shared calendar", href: "/dashboard/calendar" },
  { label: "Manage organization users", href: "/dashboard/users" },
  { label: "Configure organization settings", href: "/dashboard/settings" },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [stats, upcomingBookings, organization] = await Promise.all([
    withTenantScope(user.tenantId, (tx) => {
      const now = new Date();
      return Promise.all([
        tx.booking.count(),
        tx.booking.count({
          where: { startsAt: { gte: now }, status: { not: "CANCELLED" } },
        }),
        tx.user.count(),
      ]);
    }),
    withTenantScope(user.tenantId, (tx) =>
      tx.booking.findMany({
        where: { startsAt: { gte: new Date() }, status: { not: "CANCELLED" } },
        include: { user: { select: { name: true } } },
        orderBy: { startsAt: "asc" },
        take: 5,
      })
    ),
    withTenantScope(user.tenantId, (tx) =>
      tx.tenant.findUnique({
        where: { id: user.tenantId },
        select: { name: true, subdomain: true, plan: true },
      })
    ),
  ]);

  const [totalBookings, upcomingCount, totalUsers] = stats;
  const firstName = user.name.split(/\s+/)[0] ?? user.name;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Good to see you, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here is what is happening in your organization right now.
        </p>
      </div>

      <SummaryCards
        totalBookings={totalBookings}
        upcomingBookings={upcomingCount}
        totalUsers={totalUsers}
        organization={{
          name: organization?.name ?? "—",
          subdomain: organization?.subdomain ?? "—",
          plan: organization?.plan ?? "free",
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Upcoming bookings</h2>
              <Link
                href="/dashboard/bookings"
                className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
              >
                View all
              </Link>
            </div>
            <div className="p-5">
              {upcomingBookings.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon className="h-5 w-5" />}
                  title="No upcoming bookings"
                  description="New bookings created by your team will appear here."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {upcomingBookings.map((booking) => (
                    <li key={booking.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {booking.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDateTime(booking.startsAt)} · {booking.user.name}
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

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Getting started</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Week 1 foundation — all core areas ready
            </p>
          </div>
          <ul className="space-y-2 p-4">
            {gettingStarted.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
