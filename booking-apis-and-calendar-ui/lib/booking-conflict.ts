import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

interface CheckConflictParams {
  tenantId: string;
  startDateTime: Date;
  endDateTime: Date;
  excludeBookingId?: string;
}

/**
 * Checks if a requested time slot overlaps with any active bookings for the tenant.
 * Uses strict interval intersection: (SlotStart < ExistingEnd) AND (SlotEnd > ExistingStart).
 * Adjacent bookings (e.g. 10:00-11:00 and 11:00-12:00) are permitted without conflict.
 */
export async function findBookingConflict({
  tenantId,
  startDateTime,
  endDateTime,
  excludeBookingId,
}: CheckConflictParams) {
  // Only non-cancelled bookings create a scheduling conflict
  const activeStatuses: BookingStatus[] = [
    BookingStatus.CONFIRMED,
    BookingStatus.PENDING,
    BookingStatus.COMPLETED,
  ];

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      tenantId,
      status: { in: activeStatuses },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        {
          startDateTime: {
            lt: endDateTime,
          },
        },
        {
          endDateTime: {
            gt: startDateTime,
          },
        },
      ],
    },
    select: {
      id: true,
      customerName: true,
      serviceName: true,
      startTime: true,
      endTime: true,
      bookingDate: true,
    },
  });

  return conflictingBooking;
}
