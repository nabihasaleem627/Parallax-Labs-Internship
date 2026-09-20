import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { withAuthScope } from "@/lib/db/tenant";
import { hashPassword } from "@/lib/auth/password";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { apiError, zodValidationError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Invalid request body");
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return zodValidationError(parsed.error);

  const { token, password } = parsed.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const passwordHash = await hashPassword(password);

  // Single use: the token row is deleted in the same transaction that the
  // password is updated.
  const result = await withAuthScope(async (tx) => {
    const tokenRow = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!tokenRow) return { valid: false as const };
    if (tokenRow.expiresAt.getTime() <= Date.now()) {
      await tx.passwordResetToken.delete({ where: { id: tokenRow.id } });
      return { valid: false as const };
    }

    await tx.user.update({ where: { id: tokenRow.userId }, data: { passwordHash } });
    await tx.passwordResetToken.delete({ where: { id: tokenRow.id } });
    return { valid: true as const };
  });

  if (!result.valid) {
    return apiError(400, "This reset link is invalid or has expired. Please request a new one.");
  }

  return NextResponse.json({ ok: true });
}
