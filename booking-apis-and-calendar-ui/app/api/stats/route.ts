import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/stats
 * Aggregates real database metrics for the current tenant workspace.
 */
export async function GET(req: NextRequest) {
  try {
    const tenantCtx = await resolveTenant(req);
    if (!tenantCtx) {
      return apiError("UNAUTHORIZED", "Tenant workspace not found", 401);
    }

    const tenantId = tenantCtx.tenantId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalBookings,
      todayBookings,
      upcomingBookings,
      cancelledBookings,
      completedBookings,
      totalCustomers,
      revenueResult,
    ] = await Promise.all([
      // Total bookings
      prisma.booking.count({ where: { tenantId } }),

      // Today's bookings
      prisma.booking.count({
        where: {
          tenantId,
          bookingDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Upcoming bookings
      prisma.booking.count({
        where: {
          tenantId,
          startDateTime: { gte: todayStart },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        },
      }),

      // Cancelled bookings
      prisma.booking.count({
        where: {
          tenantId,
          status: BookingStatus.CANCELLED,
        },
      }),

      // Completed bookings
      prisma.booking.count({
        where: {
          tenantId,
          status: BookingStatus.COMPLETED,
        },
      }),

      // Total distinct customers
      prisma.customer.count({
        where: { tenantId },
      }),

      // Total revenue from confirmed and completed bookings
      prisma.booking.aggregate({
        where: {
          tenantId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
        _sum: {
          price: true,
        },
      }),
    ]);

    const stats = {
      totalBookings,
      todayBookings,
      upcomingBookings,
      cancelledBookings,
      completedBookings,
      totalCustomers,
      totalRevenue: revenueResult._sum.price || 0,
      currency: tenantCtx.tenant.currency || "USD",
    };

    return apiSuccess(stats);
  } catch (error) {
    console.error("GET /api/stats internal error:", error);
    return apiError("INTERNAL_ERROR", "Failed to load dashboard metrics", 500);
  }
}
