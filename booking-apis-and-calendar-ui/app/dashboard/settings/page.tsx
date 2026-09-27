import React from "react";
import { TenantSettings } from "@/components/settings/TenantSettings";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-600" />
          Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure business operating hours, timezones, and multi-tenant API integration keys.
        </p>
      </div>

      <TenantSettings />
    </div>
  );
}
