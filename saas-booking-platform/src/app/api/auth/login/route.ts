import { NextResponse } from "next/server";
import { withAuthScope } from "@/lib/db/tenant";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation/schemas";
import { apiError, zodValidationError } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid request body");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const { email, password, rememberMe } = parsed.data;

  // Cross-tenant lookup is only allowed inside the short-lived auth scope
  // (the tenant is not known until after the user is identified).
  const user = await withAuthScope((tx) =>
    tx.user.findUnique({ where: { email } })
  );

  // Same message for unknown email and wrong password — no account enumeration.
  const invalid = NextResponse.json(
    { ok: false, error: "Invalid email or password" },
    { status: 401 }
  );
  if (!user) return invalid;

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) return invalid;

  await setSessionCookie(
    {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    rememberMe
  );

  return NextResponse.json({ ok: true });
}
