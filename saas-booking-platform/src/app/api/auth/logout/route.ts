import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
