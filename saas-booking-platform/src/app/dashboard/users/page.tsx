import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { withTenantScope } from "@/lib/db/tenant";
import { canManageUsers } from "@/lib/authz/permissions";
import { RoleBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const members = await withTenantScope(user.tenantId, (tx) =>
    tx.user.findMany({ orderBy: { createdAt: "asc" } })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everyone in your organization — {members.length} member
          {members.length === 1 ? "" : "s"}.
        </p>
      </div>

      {!canManageUsers(user.role) && (
        <Alert tone="info">
          You are viewing your organization&rsquo;s members. Role management is available to
          organization admins.
        </Alert>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {member.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {member.name}
                          {member.id === user.id && (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                    {formatDate(member.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-slate-100 sm:hidden">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {member.name}
                  {member.id === user.id && (
                    <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">{member.email}</p>
              </div>
              <RoleBadge role={member.role} />
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-slate-400">
        Role changes, invitations and SSO are scheduled for later weeks. New members join
        during registration by entering your organization&rsquo;s subdomain.
      </p>
    </div>
  );
}
