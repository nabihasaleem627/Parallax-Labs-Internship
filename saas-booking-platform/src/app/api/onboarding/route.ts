import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db/prisma";
import { withTenantScope } from "@/lib/db/tenant";
import { isUniqueConstraintError } from "@/lib/db/errors";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { onboardingSchema } from "@/lib/validation/schemas";
import { apiError, zodValidationError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Organization onboarding: creates a new Tenant plus its first user, who is
 * automatically assigned the ORG_ADMIN role, then signs them in.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid request body");
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const { organizationName, subdomain, adminName, email, password } = parsed.data;

  const prisma = getPrisma();
  const existing = await prisma.tenant.findUnique({ where: { subdomain } });
  if (existing) {
    return apiError(409, "That subdomain is already taken. Try another one.");
  }

  const passwordHash = await hashPassword(password);

  try {
    const tenant = await prisma.tenant.create({
      data: { name: organizationName, subdomain },
      select: { id: true },
    });

    const admin = await withTenantScope(tenant.id, (tx) =>
      tx.user.create({
        data: { tenantId: tenant.id, email, name: adminName, passwordHash, role: "ORG_ADMIN" },
        select: { id: true, tenantId: true, role: true, name: true, email: true },
      })
    );

    // Sign the new organization admin in immediately.
    await setSessionCookie(
      { sub: admin.id, tenantId: admin.tenantId, role: admin.role, name: admin.name, email: admin.email },
      true
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      // Lost a subdomain race: clean up the orphaned tenant if we created one.
      await prisma.tenant.deleteMany({ where: { subdomain } }).catch(() => undefined);
      return apiError(409, "That subdomain is already taken. Try another one.");
    }
    throw error;
  }
}
