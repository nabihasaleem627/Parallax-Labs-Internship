import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const auth = await getCurrentAuth();
  if (!auth) {
    redirect("/login");
  }

  return (
    <AppShell user={auth.user} tenant={auth.tenant} role={auth.role}>
      {children}
    </AppShell>
  );
}
