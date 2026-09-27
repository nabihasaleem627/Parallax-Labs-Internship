import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateBookingSchema } from "@/lib/validations/booking";
import { findBookingConflict } from "@/lib/booking-conflict";
import { buildDateTime } from "@/lib/utils";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/bookings/:id
 * Fetches a single booking strictly scoped to the tenant.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantCtx = await resolveTenant(req);
    if (!tenantCtx) {
      return apiError("UNAUTHORIZED", "Tenant workspace not found or unauthenticated", 401);
    }

    const bookingId = params.id;
    if (!bookingId) {
      return apiError("VALIDATION_ERROR", "Booking ID is required", 400);
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: tenantCtx.tenantId,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    if (!booking) {
      return apiError("NOT_FOUND", "Booking not found or does not belong to this workspace", 404);
    }

    return apiSuccess(booking);
  } catch (error) {
    console.error("GET /api/bookings/:id internal error:", error);
    return apiError("INTERNAL_ERROR", "Failed to retrieve booking", 500);
  }
}

/**
 * PATCH /api/bookings/:id
 * Updates an existing booking with validation and conflict checking.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantCtx = await resolveTenant(req);
    if (!tenantCtx) {
      return apiError("UNAUTHORIZED", "Tenant workspace not found or unauthenticated", 401);
    }

    const bookingId = params.id;
    if (!bookingId) {
      return apiError("VALIDATION_ERROR", "Booking ID is required", 400);
    }

    // Verify existing booking belongs to tenant
    const existing = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: tenantCtx.tenantId,
      },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "Booking not found", 404);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    const parseResult = updateBookingSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return apiError("VALIDATION_ERROR", "Invalid update data", 400, details);
    }

    const data = parseResult.data;

    // Determine target date and time boundaries
    const targetDateStr = data.bookingDate || existing.bookingDate.toISOString().split("T")[0];
    const targetStartTime = data.startTime || existing.startTime;
    const targetEndTime = data.endTime || existing.endTime;

    const startDateTime = buildDateTime(targetDateStr, targetStartTime);
    const endDateTime = buildDateTime(targetDateStr, targetEndTime);

    const willBeActive = data.status
      ? data.status !== "CANCELLED"
      : existing.status !== "CANCELLED";

    // If active, check for conflicts with other bookings
    if (willBeActive) {
      const conflictingBooking = await findBookingConflict({
        tenantId: tenantCtx.tenantId,
        startDateTime,
        endDateTime,
        excludeBookingId: bookingId,
      });

      if (conflictingBooking) {
        return apiError("BOOKING_CONFLICT", "This time slot is already booked.", 409);
      }
    }

    // Build update payload
    const updateData: Record<string, unknown> = {};

    if (data.customerName !== undefined) updateData.customerName = data.customerName;
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail.toLowerCase().trim();
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
    if (data.serviceName !== undefined) updateData.serviceName = data.serviceName;
    if (data.serviceId !== undefined) updateData.serviceId = data.serviceId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.status !== undefined) updateData.status = data.status as BookingStatus;

    if (data.bookingDate || data.startTime || data.endTime) {
      const bDate = new Date(targetDateStr);
      bDate.setHours(0, 0, 0, 0);
      updateData.bookingDate = bDate;
      updateData.startTime = targetStartTime;
      updateData.endTime = targetEndTime;
      updateData.startDateTime = startDateTime;
      updateData.endDateTime = endDateTime;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        customer: true,
        service: true,
      },
    });

    return apiSuccess(updatedBooking);
  } catch (error) {
    console.error("PATCH /api/bookings/:id internal error:", error);
    return apiError("INTERNAL_ERROR", "Failed to update booking", 500);
  }
}

/**
 * DELETE /api/bookings/:id
 * Permanently deletes a booking within the tenant context.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantCtx = await resolveTenant(req);
    if (!tenantCtx) {
      return apiError("UNAUTHORIZED", "Tenant workspace not found or unauthenticated", 401);
    }

    const bookingId = params.id;
    if (!bookingId) {
      return apiError("VALIDATION_ERROR", "Booking ID is required", 400);
    }

    const existing = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: tenantCtx.tenantId,
      },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "Booking not found", 404);
    }

    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return apiSuccess({
      id: bookingId,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/bookings/:id internal error:", error);
    return apiError("INTERNAL_ERROR", "Failed to delete booking", 500);
  }
}
