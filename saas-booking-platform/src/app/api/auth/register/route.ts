import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db/prisma";
import { withTenantScope } from "@/lib/db/tenant";
import { isUniqueConstraintError } from "@/lib/db/errors";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validation/schemas";
import { apiError, zodValidationError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Creates a member account inside an existing organization.
 * Week 1 scope: users join by typing the organization subdomain (no invites
 * yet — that is a later-week feature). New members start with the USER role;
 * organization admins can promote them from the Users page.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid request body");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const { fullName, email, organizationSubdomain, password } = parsed.data;

  // Tenant lookup is allowed for the app role (Tenant rows are public-ish:
  // name + subdomain), so no auth scope is needed here.
  const tenant = await getPrisma().tenant.findUnique({
    where: { subdomain: organizationSubdomain },
    select: { id: true, name: true },
  });
  if (!tenant) {
    return apiError(404, "No organization found for that subdomain. Double-check it with your team.");
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await withTenantScope(tenant.id, (tx) =>
      tx.user.create({
        data: { tenantId: tenant.id, email, name: fullName, passwordHash, role: "USER" },
        select: { id: true, tenantId: true, role: true, name: true, email: true },
      })
    );
    // Auto-sign-in on successful registration.
    await setSessionCookie(
      { sub: user.id, tenantId: user.tenantId, role: user.role, name: user.name, email: user.email },
      true
    );
    return NextResponse.json({ ok: true, data: { tenant: tenant.name } }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return apiError(409, "An account with that email already exists.");
    }
    throw error;
  }
}
