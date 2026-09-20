import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { withTenantScope } from "@/lib/db/tenant";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The middleware already rejects missing/expired sessions; this is the
  // authoritative re-check against the database (role changes take effect
  // immediately, deleted accounts are locked out).
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const organization = await withTenantScope(user.tenantId, (tx) =>
    tx.tenant.findUnique({
      where: { id: user.tenantId },
      select: { name: true, subdomain: true, plan: true },
    })
  );
  if (!organization) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar organization={organization} />
      <div className="flex min-h-screen flex-col md:pl-64">
        <Topbar
          user={{ name: user.name, email: user.email, role: user.role }}
          organization={organization}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
