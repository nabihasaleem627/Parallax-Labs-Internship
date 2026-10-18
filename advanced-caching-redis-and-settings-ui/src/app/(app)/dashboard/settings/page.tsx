import { getCurrentAuth } from "@/lib/auth";
import { getTenantSettings } from "@/lib/tenant-settings";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const auth = await getCurrentAuth();
  if (!auth) return null;

  const { settings, source } = await getTenantSettings(auth.tenant.id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tenant Settings</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Changes are saved to the database and the tenant-scoped Redis cache entry is refreshed automatically.
        </p>
      </div>
      <SettingsForm initialSettings={settings} initialSource={source} canEdit={auth.role !== "member"} />
    </div>
  );
}
