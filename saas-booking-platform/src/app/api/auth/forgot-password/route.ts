import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { withAuthScope } from "@/lib/db/tenant";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { apiError, zodValidationError } from "@/lib/api";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Creates a single-use, 1-hour password reset token.
 *
 * The token is stored hashed (SHA-256) — the database never holds a usable
 * token. The raw token is only ever returned in development, where no email
 * provider is configured; in production an email provider (e.g. Resend or
 * Postmark) would send the reset link — see README "Week 1 progress".
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid request body");
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const { email } = parsed.data;
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const user = await withAuthScope(async (tx) => {
    const found = await tx.user.findUnique({ where: { email } });
    if (!found) return null;

    await tx.passwordResetToken.deleteMany({ where: { userId: found.id } });
    await tx.passwordResetToken.create({
      data: { userId: found.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });
    return found.id;
  });

  // Identical response whether or not the account exists — no email enumeration.
  const response = { ok: true, message: "If that email belongs to an account, a reset link has been prepared." };
  if (user && process.env.NODE_ENV !== "production") {
    const baseUrl = getEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.json({ ...response, devResetUrl: `${baseUrl}/reset-password?token=${rawToken}` });
  }

  return NextResponse.json(response);
}
