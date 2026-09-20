import { cookies } from "next/headers";
import { withTenantScope } from "@/lib/db/tenant";
import type { UserRole } from "@prisma/client";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
  type SessionClaims,
} from "./jwt";

export async function setSessionCookie(claims: SessionClaims, rememberMe: boolean): Promise<void> {
  const token = await createSessionToken(claims, rememberMe);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions(rememberMe));
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export type CurrentUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
};

/**
 * Verifies the session, then re-reads the user inside the tenant scope.
 *
 * Re-reading from the database means a deleted account or a role change is
 * reflected immediately, and the role used for authorization always comes
 * from the database — never from the (potentially stale) JWT.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const user = await withTenantScope(claims.tenantId, (tx) =>
    tx.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, tenantId: true, email: true, name: true, role: true },
    })
  );

  if (!user || user.tenantId !== claims.tenantId) return null;
  return user;
}
