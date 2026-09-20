import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { withTenantScope } from "@/lib/db/tenant";
import { canManageOwnBookings } from "@/lib/authz/permissions";
import { bookingSchema } from "@/lib/validation/schemas";
import { apiError, zodValidationError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Lists the current user's organization bookings (tenant-scoped by RLS).
 */
export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return apiError(401, "Not authenticated");

  const bookings = await withTenantScope(user.tenantId, (tx) =>
    tx.booking.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { startsAt: "desc" },
      take: 200,
    })
  );

  return NextResponse.json({ ok: true, data: bookings });
}

/**
 * Creates a booking, attributed to the signed-in user.
 *
 * Every member of the organization can create bookings (regular members
 * book for themselves; staff and admins book for the team and additionally
 * get confirm/cancel/delete powers on the Booking endpoints).
 * `tenantId` is always taken from the session — never from the request body.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return apiError(401, "Not authenticated");
  if (!canManageOwnBookings(user.role)) {
    return apiError(403, "You do not have permission to create bookings");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid request body");
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const { title, notes, startsAt, endsAt, status } = parsed.data;

  const booking = await withTenantScope(user.tenantId, (tx) =>
    tx.booking.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        title,
        notes: notes || null,
        startsAt,
        endsAt,
        status,
      },
    })
  );

  return NextResponse.json({ ok: true, data: booking }, { status: 201 });
}
