import type { UserRole } from "@prisma/client";

/** Organization admins and staff manage the organization's bookings. */
export function canManageBookings(role: UserRole): boolean {
  return role === "ORG_ADMIN" || role === "STAFF";
}

/** Only organization admins manage users and organization settings. */
export function canManageUsers(role: UserRole): boolean {
  return role === "ORG_ADMIN";
}

/** Regular members may create/cancel their own bookings. */
export function canManageOwnBookings(role: UserRole): boolean {
  return role === "ORG_ADMIN" || role === "STAFF" || role === "USER";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "ORG_ADMIN":
      return "Organization Admin";
    case "STAFF":
      return "Staff";
    case "USER":
      return "Member";
  }
}
