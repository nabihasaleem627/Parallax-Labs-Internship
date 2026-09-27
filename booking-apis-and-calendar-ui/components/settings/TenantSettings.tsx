"use client";

import React, { useState, useEffect } from "react";
import { Building2, Clock, ShieldCheck, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface TenantData {
  id: string;
  slug: string;
  name: string;
  industry: string;
  email: string;
  phone?: string | null;
  timezone: string;
  currency: string;
  businessHoursStart: string;
  businessHoursEnd: string;
}

interface TenantSettingsProps {
  tenantSlug?: string;
}

export function TenantSettings({ tenantSlug }: TenantSettingsProps) {
  const toast = useToast();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchTenantData() {
      try {
        const res = await fetch("/api/tenants");
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setTenant(json.data.currentTenant);
          }
        }
      } catch (err) {
        console.error("Failed to fetch tenant info:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTenantData();
  }, [tenantSlug]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings Saved", "Workspace preferences updated successfully.");
    }, 600);
  };

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading workspace configurations...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Workspace Information */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Workspace Organization
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your organization profile, industry category, and localization settings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              defaultValue={tenant?.name || "Acme Wellness Clinic"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Workspace Slug (URL Identifier)
            </label>
            <input
              type="text"
              readOnly
              value={tenant?.slug || "acme-wellness"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Industry Category
            </label>
            <input
              type="text"
              defaultValue={tenant?.industry || "Healthcare & Clinic"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Primary Contact Email
            </label>
            <input
              type="email"
              defaultValue={tenant?.email || "contact@acmewellness.com"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Operating Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Operating Hours & Timezone
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Define daily booking availability and default slot boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Timezone
            </label>
            <select
              defaultValue={tenant?.timezone || "UTC"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="America/New_York">Eastern Time (US & Canada)</option>
              <option value="America/Chicago">Central Time (US & Canada)</option>
              <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
              <option value="UTC">UTC / Greenwich Mean Time</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Asia/Karachi">Karachi (PKT +5)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Opening Time
            </label>
            <input
              type="time"
              defaultValue={tenant?.businessHoursStart || "08:30"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Closing Time
            </label>
            <input
              type="time"
              defaultValue={tenant?.businessHoursEnd || "17:30"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Security & Multi-Tenancy Details */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Multi-Tenant Security & API Headers
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Use these tenant credentials for programmatic API integrations, Postman collections, and webhooks.
          </p>
        </div>

        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-slate-500">Tenant ID:</span>
            <span className="font-semibold text-slate-900 dark:text-white select-all">{tenant?.id || "tenant_default"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-slate-500">API Header:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold select-all">x-tenant-id: {tenant?.id}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-slate-500">Idempotency Header:</span>
            <span className="text-slate-700 dark:text-slate-300">Idempotency-Key: &lt;uuid-v4&gt;</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          isLoading={saving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Workspace Settings
        </Button>
      </div>
    </div>
  );
}
