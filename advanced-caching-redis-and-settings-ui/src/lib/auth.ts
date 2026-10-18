import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, sessions, tenants, users } from "@/db/schema";

export const SESSION_COOKIE = "ph_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: number, tenantId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ token, userId, tenantId, expiresAt });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export interface AuthContext {
  token: string;
  user: { id: number; name: string; email: string };
  tenant: { id: number; name: string; slug: string };
  role: "owner" | "admin" | "member";
}

export async function getSessionFromStore(token: string | undefined): Promise<AuthContext | null> {
  if (!token) return null;

  const [row] = await db
    .select({
      token: sessions.token,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      tenantId: tenants.id,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      role: memberships.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(tenants, eq(sessions.tenantId, tenants.id))
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await destroySession(token);
    return null;
  }

  return {
    token: row.token,
    user: { id: row.userId, name: row.userName, email: row.userEmail },
    tenant: { id: row.tenantId, name: row.tenantName, slug: row.tenantSlug },
    role: row.role,
  };
}

/** Reads the session cookie from the current request context (server components, route handlers). */
export async function getCurrentAuth(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getSessionFromStore(token);
}

export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_TTL_MS / 1000);
