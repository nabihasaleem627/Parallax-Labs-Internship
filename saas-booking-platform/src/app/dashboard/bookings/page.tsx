import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { withTenantScope } from "@/lib/db/tenant";
import { BookingsTable } from "@/components/dashboard/bookings-table";
import { NewBookingPanel } from "@/components/dashboard/new-booking-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookings = await withTenantScope(user.tenantId, (tx) =>
    tx.booking.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { startsAt: "desc" },
      take: 200,
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every booking made inside your organization, newest first.
          </p>
        </div>
        <NewBookingPanel />
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-5 w-5" />}
          title="No bookings yet"
          description="Create your first booking to get started — it will show up for everyone in your organization."
        />
      ) : (
        <BookingsTable bookings={bookings} currentUser={user} />
      )}
    </div>
  );
}
