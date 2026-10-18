import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, tenants, users } from "@/db/schema";
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, verifyPassword } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) {
    return apiError("Invalid email or password", 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return apiError("Invalid email or password", 401);
  }

  const [membership] = await db
    .select({ tenantId: memberships.tenantId, tenantName: tenants.name, tenantSlug: tenants.slug })
    .from(memberships)
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (!membership) {
    return apiError("No workspace is associated with this account", 403);
  }

  const token = await createSession(user.id, membership.tenantId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return apiOk({
    user: { id: user.id, name: user.name, email: user.email },
    tenant: { id: membership.tenantId, name: membership.tenantName, slug: membership.tenantSlug },
  });
}
