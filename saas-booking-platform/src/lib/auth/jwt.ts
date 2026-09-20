import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import { getEnv } from "@/lib/env";

export const SESSION_COOKIE = "bookflow_session";

const SESSION_DURATION = 60 * 60; // 1 hour
const REMEMBER_ME_DURATION = 60 * 60 * 24 * 7; // 7 days

export type SessionClaims = {
  sub: string;
  tenantId: string;
  role: UserRole;
  name: string;
  email: string;
};

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export async function createSessionToken(
  claims: SessionClaims,
  rememberMe: boolean
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(rememberMe ? `${REMEMBER_ME_DURATION}s` : `${SESSION_DURATION}s`)
    .sign(secretKey());
}

/**
 * Verifies signature and expiry. Returns null for any malformed, expired or
 * tampered token — callers must treat null as "not authenticated".
 */
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const role = payload.role;
    if (typeof payload.sub !== "string" || typeof payload.tenantId !== "string") return null;
    if (role !== "ORG_ADMIN" && role !== "STAFF" && role !== "USER") return null;
    return {
      sub: payload.sub,
      tenantId: payload.tenantId,
      role,
      name: typeof payload.name === "string" ? payload.name : "",
      email: typeof payload.email === "string" ? payload.email : "",
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(rememberMe: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION,
  };
}
