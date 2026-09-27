import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createBookingSchema, bookingQuerySchema } from "@/lib/validations/booking";
import { findBookingConflict } from "@/lib/booking-conflict";
import { getStoredIdempotencyResponse, saveIdempotencyResponse } from "@/lib/idempotency";
import { buildDateTime } from "@/lib/utils";
import { BookingStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings
 * Retrieves a list of bookings for the current tenant with optional status, date, and search filters.
 */
export async function GET(req: NextRequest) {
  try {
    const tenantCtx = await resolveTenant(req);
    if (!tenantCtx) {
      return apiError("UNAUTHORIZED", "Tenant workspace not found or unauthenticated", 401);
    }

    const { searchParams } = new URL(req.url);
    const rawQuery = Object.fromEntries(searchParams.entries());
    const parseResult = bookingQuerySchema.safeParse(rawQuery);

    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return apiError("VALIDATION_ERROR", "Invalid query parameters", 400, details);
    }

    const { date, startDate, endDate, status, search, page, limit } = parseResult.data;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      tenantId: tenantCtx.tenantId,
    };

    if (status) {
      where.status = status as BookingStatus;
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.bookingDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (startDate || endDate) {
      where.bookingDate = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        where.bookingDate.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.bookingDate.lte = e;
      }
    }

    if (search && search.trim() !== "") {
      const s = search.trim();
      where.OR = [
        { customerName: { contains: s, mode: "insensitive" } },
        { customerEmail: { contains: s, mode: "insensitive" } },
        { serviceName: { contains: s, mode: "insensitive" } },
        { notes: { contains: s, mode: "insensitive" } },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          customer: true,
          service: true,
        },
        orderBy: [
          { bookingDate: "desc" },
          { startTime: "asc" },
        ],
        skip,
        take: limit,
      }),
    ]);

    return apiSuccess(bookings, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/bookings internal error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred while fetching bookings", 500);
  }
}

/**
 * POST /api/bookings
 * Creates a new booking with strict idempotency and conflict prevention.
 */
export async function POST(req: NextRequest) {
  try {
    const tenantCtx = await resolveTenant(req);
    if (!tenantCtx) {
      return apiError("UNAUTHORIZED", "Tenant workspace not found or unauthenticated", 401);
    }

    const idempotencyKey = req.headers.get("idempotency-key") || req.headers.get("Idempotency-Key");

    // Check if request was already handled with this idempotency key
    if (idempotencyKey) {
      const stored = await getStoredIdempotencyResponse(tenantCtx.tenantId, idempotencyKey);
      if (stored) {
        // Return existing result with replay header
        return apiSuccess(
          (stored.body as { data?: unknown })?.data ?? stored.body,
          stored.status,
          undefined,
          { "Idempotent-Replayed": "true" }
        );
      }
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return apiError("VALIDATION_ERROR", "Invalid JSON request body", 400);
    }

    const parseResult = createBookingSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return apiError("VALIDATION_ERROR", "Invalid booking data", 400, details);
    }

    const data = parseResult.data;

    // Calculate exact timestamps
    const bookingDateObj = new Date(data.bookingDate);
    bookingDateObj.setHours(0, 0, 0, 0);

    const startDateTime = buildDateTime(data.bookingDate, data.startTime);
    const endDateTime = buildDateTime(data.bookingDate, data.endTime);

    // Double-Booking Conflict Prevention
    const conflictingBooking = await findBookingConflict({
      tenantId: tenantCtx.tenantId,
      startDateTime,
      endDateTime,
    });

    if (conflictingBooking) {
      const conflictResponse = {
        success: false,
        error: {
          code: "BOOKING_CONFLICT" as const,
          message: "This time slot is already booked.",
        },
      };

      if (idempotencyKey) {
        await saveIdempotencyResponse(
          tenantCtx.tenantId,
          idempotencyKey,
          "/api/bookings",
          rawBody,
          409,
          conflictResponse
        );
      }

      return apiError("BOOKING_CONFLICT", "This time slot is already booked.", 409);
    }

    // Auto-link or create customer profile
    let customerId: string | undefined = undefined;
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenantCtx.tenantId,
          email: data.customerEmail.toLowerCase().trim(),
        },
      },
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          tenantId: tenantCtx.tenantId,
          name: data.customerName,
          email: data.customerEmail.toLowerCase().trim(),
          phone: data.customerPhone || null,
        },
      });
      customerId = newCustomer.id;
    }

    // Resolve service name if serviceId is provided
    let finalServiceName = data.serviceName;
    let finalPrice = Number(data.price) || 0;
    if (data.serviceId) {
      const foundService = await prisma.service.findFirst({
        where: {
          id: data.serviceId,
          tenantId: tenantCtx.tenantId,
        },
      });
      if (foundService) {
        finalServiceName = foundService.name;
        if (!data.price || data.price === 0) {
          finalPrice = foundService.price;
        }
      }
    }

    // Create the booking in a transaction with isolation
    const newBooking = await prisma.booking.create({
      data: {
        tenantId: tenantCtx.tenantId,
        customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail.toLowerCase().trim(),
        customerPhone: data.customerPhone || null,
        serviceId: data.serviceId || null,
        serviceName: finalServiceName,
        bookingDate: bookingDateObj,
        startTime: data.startTime,
        endTime: data.endTime,
        startDateTime,
        endDateTime,
        status: data.status as BookingStatus,
        notes: data.notes || null,
        price: finalPrice,
        idempotencyKey: idempotencyKey || null,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    const successResponse = {
      success: true,
      data: newBooking,
    };

    // Store idempotency response for safe retries
    if (idempotencyKey) {
      await saveIdempotencyResponse(
        tenantCtx.tenantId,
        idempotencyKey,
        "/api/bookings",
        rawBody,
        201,
        successResponse
      );
    }

    return apiSuccess(newBooking, 201);
  } catch (error) {
    console.error("POST /api/bookings internal error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred while creating booking", 500);
  }
}
