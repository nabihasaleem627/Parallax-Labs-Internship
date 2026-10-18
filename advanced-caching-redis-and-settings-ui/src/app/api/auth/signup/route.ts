import { cookies } from "next/headers";
import { db } from "@/db";
import { memberships, tenants, tenantSettings, users, activityLog } from "@/db/schema";
import { createSession, hashPassword, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { signupSchema } from "@/lib/validation";
import { randomSuffix, slugify } from "@/lib/slug";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON", 400);
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
  }
  const { name, email, password, workspaceName } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (existing) {
    return apiError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);

  let baseSlug = slugify(workspaceName);
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const [collision] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!collision) break;
    slug = `${baseSlug}-${randomSuffix()}`;
  }

  const result = await db.transaction(async (tx) => {
    const [tenant] = await tx.insert(tenants).values({ name: workspaceName, slug }).returning();
    const [user] = await tx
      .insert(users)
      .values({ name, email: email.toLowerCase(), passwordHash })
      .returning();
    await tx.insert(memberships).values({ userId: user.id, tenantId: tenant.id, role: "owner" });
    await tx.insert(tenantSettings).values({
      tenantId: tenant.id,
      workspaceName: tenant.name,
      updatedBy: user.id,
    });
    await tx.insert(activityLog).values({
      tenantId: tenant.id,
      userId: user.id,
      action: "workspace_created",
      metadata: { workspaceName: tenant.name },
    });
    return { tenant, user };
  });

  const token = await createSession(result.user.id, result.tenant.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return apiOk({
    user: { id: result.user.id, name: result.user.name, email: result.user.email },
    tenant: { id: result.tenant.id, name: result.tenant.name, slug: result.tenant.slug },
  });
}
