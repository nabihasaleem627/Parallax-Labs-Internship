import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { withTenantScope } from "@/lib/db/tenant";
import { canManageBookings } from "@/lib/authz/permissions";
import { updateBookingStatusSchema } from "@/lib/validation/schemas";
import { apiError, zodValidationError } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Updates a booking's status.
 *  - Staff / org admins: any status change.
 *  - Members: can only CANCEL their own bookings.
 *
 * The booking is loaded inside the tenant scope, so a booking id belonging to
 * another organization is simply not visible (404 — no existence leak).
 */
export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return apiError(401, "Not authenticated");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid request body");
  }

  const parsed = updateBookingStatusSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const { id } = await params;
  const isManager = canManageBookings(user.role);

  const booking = await withTenantScope(user.tenantId, (tx) =>
    tx.booking.findUnique({ where: { id }, select: { id: true, userId: true, status: true } })
  );
  if (!booking) return apiError(404, "Booking not found");

  if (!isManager) {
    const isOwn = booking.userId === user.id;
    if (!isOwn || parsed.data.status !== "CANCELLED") {
      return apiError(403, "You can only cancel your own bookings");
    }
  }

  const updated = await withTenantScope(user.tenantId, (tx) =>
    tx.booking.update({ where: { id }, data: { status: parsed.data.status } })
  );

  return NextResponse.json({ ok: true, data: updated });
}

/** Deletes a booking. Staff / org admins only. */
export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return apiError(401, "Not authenticated");
  if (!canManageBookings(user.role)) {
    return apiError(403, "You do not have permission to delete bookings");
  }

  const { id } = await params;
  const booking = await withTenantScope(user.tenantId, (tx) =>
    tx.booking.findUnique({ where: { id }, select: { id: true } })
  );
  if (!booking) return apiError(404, "Booking not found");

  await withTenantScope(user.tenantId, (tx) => tx.booking.delete({ where: { id } }));

  return NextResponse.json({ ok: true });
}
