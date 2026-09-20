import type { Booking, User } from "@prisma/client";
import { BookingStatusBadge } from "@/components/ui/badge";
import { BookingRowActions } from "./booking-row-actions";
import { formatDateTime } from "@/lib/format";

export type BookingWithUser = Booking & { user: Pick<User, "name" | "email"> };

type CurrentUser = {
  id: string;
  role: "ORG_ADMIN" | "STAFF" | "USER";
};

export function BookingsTable({
  bookings,
  currentUser,
}: {
  bookings: BookingWithUser[];
  currentUser: CurrentUser;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Booking</th>
              <th className="px-5 py-3 font-semibold">Member</th>
              <th className="px-5 py-3 font-semibold">Starts</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="transition-colors hover:bg-slate-50/50">
                <td className="max-w-64 px-5 py-3.5">
                  <p className="truncate font-medium text-slate-900">{booking.title}</p>
                  {booking.notes && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{booking.notes}</p>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-slate-900">{booking.user.name}</p>
                  <p className="text-xs text-slate-500">{booking.user.email}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                  {formatDateTime(booking.startsAt)}
                </td>
                <td className="px-5 py-3.5">
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <BookingRowActions booking={booking} currentUser={currentUser} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {bookings.map((booking) => (
          <li key={booking.id} className="space-y-2 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{booking.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDateTime(booking.startsAt)} · {booking.user.name}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            {booking.notes && <p className="text-xs text-slate-500">{booking.notes}</p>}
            <div className="flex justify-end">
              <BookingRowActions booking={booking} currentUser={currentUser} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
