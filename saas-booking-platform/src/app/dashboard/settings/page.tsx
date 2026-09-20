import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { withTenantScope } from "@/lib/db/tenant";
import { canManageUsers } from "@/lib/authz/permissions";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { roleLabel } from "@/lib/authz/permissions";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const organization = await withTenantScope(user.tenantId, (tx) =>
    tx.tenant.findUnique({ where: { id: user.tenantId } })
  );
  if (!organization) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Organization and account configuration.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Organization" description="Managed by the organization admin" />
          <CardBody className="divide-y divide-slate-100">
            <dl>
              <DetailRow label="Organization name" value={organization.name} />
              <DetailRow label="Subdomain" value={`${organization.subdomain}.bookflow.app`} />
              <DetailRow
                label="Plan"
                value={
                  <Badge tone="indigo" className="capitalize">
                    {organization.plan}
                  </Badge>
                }
              />
              <DetailRow label="Created" value={formatDate(organization.createdAt)} />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Your profile" description="How you appear to your team" />
          <CardBody className="divide-y divide-slate-100">
            <dl>
              <DetailRow label="Full name" value={user.name} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Role" value={<RoleBadge role={user.role} />} />
              <DetailRow label="Role description" value={roleLabel(user.role)} />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Security"
            description="Password and session management"
          />
          <CardBody className="space-y-4">
            <Alert tone="info">
              In-place password changes are scheduled for a later week. You can reset your
              password at any time from the sign-in page.
            </Alert>
            <p className="text-xs text-slate-400">
              Sessions are short-lived signed tokens (1 hour, or 7 days with &ldquo;Remember
              me&rdquo;). Passwords are stored only as salted bcrypt hashes.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Billing"
            description="Plans, subscriptions and invoices"
          />
          <CardBody className="space-y-4">
            <Alert tone="info">
              Stripe billing, plan upgrades and invoices arrive in a later week. The
              database already reserves the <code className="font-mono">plan</code> field for
              this integration.
            </Alert>
          </CardBody>
        </Card>
      </div>

      {!canManageUsers(user.role) && (
        <p className="text-xs text-slate-400">
          Organization-level settings can only be changed by an organization admin.
        </p>
      )}
    </div>
  );
}
