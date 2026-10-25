"use client";

import { useEffect, useState } from "react";
import { COMMON_LANGUAGES, COMMON_TIMEZONES } from "@/lib/timezones";
import type { TenantSettingsDTO } from "@/types/settings";

export interface SettingsFormValues {
  theme: TenantSettingsDTO["theme"];
  timezone: string;
  language: string;
  notificationPreferences: TenantSettingsDTO["notificationPreferences"];
}

function toValues(settings: TenantSettingsDTO): SettingsFormValues {
  return {
    theme: settings.theme,
    timezone: settings.timezone,
    language: settings.language,
    notificationPreferences: { ...settings.notificationPreferences },
  };
}

function hasChanges(a: SettingsFormValues, b: SettingsFormValues): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export function SettingsForm({
  settings,
  saving,
  fieldErrors,
  onSave,
}: {
  settings: TenantSettingsDTO;
  saving: boolean;
  fieldErrors: Record<string, string[]> | null;
  onSave: (values: SettingsFormValues) => void;
}) {
  const [values, setValues] = useState<SettingsFormValues>(() => toValues(settings));
  const [initial, setInitial] = useState<SettingsFormValues>(() => toValues(settings));

  // Keep the form in sync when fresh settings arrive from the server
  // (e.g. after a refresh / cache revalidation) without clobbering any
  // unsaved edits mid-typing is out of scope for this demo, so we simply
  // resync whenever the tenant/settings identity changes.
  useEffect(() => {
    const next = toValues(settings);
    setValues(next);
    setInitial(next);
  }, [settings]);

  const dirty = hasChanges(values, initial);
  const timezoneKnown = COMMON_TIMEZONES.includes(values.timezone as (typeof COMMON_TIMEZONES)[number]);

  function updateNotification(key: keyof SettingsFormValues["notificationPreferences"], value: boolean) {
    setValues((prev) => ({
      ...prev,
      notificationPreferences: { ...prev.notificationPreferences, [key]: value },
    }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values);
      }}
      className="space-y-6"
      noValidate
    >
      <fieldset disabled={saving} className="space-y-6">
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-slate-700">
            Theme
          </label>
          <select
            id="theme"
            value={values.theme}
            onChange={(e) => setValues((prev) => ({ ...prev, theme: e.target.value as SettingsFormValues["theme"] }))}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="system">System default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          {fieldErrors?.theme && (
            <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.theme.join(" ")}</p>
          )}
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-slate-700">
            Timezone
          </label>
          <select
            id="timezone"
            value={timezoneKnown ? values.timezone : "__other__"}
            onChange={(e) => setValues((prev) => ({ ...prev, timezone: e.target.value }))}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {!timezoneKnown && <option value="__other__">{values.timezone} (custom)</option>}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          {fieldErrors?.timezone && (
            <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.timezone.join(" ")}</p>
          )}
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-slate-700">
            Language
          </label>
          <select
            id="language"
            value={values.language}
            onChange={(e) => setValues((prev) => ({ ...prev, language: e.target.value }))}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {COMMON_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label} ({lang.code})
              </option>
            ))}
          </select>
          {fieldErrors?.language && (
            <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.language.join(" ")}</p>
          )}
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700">Notifications</span>
          <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-3">
            {(["email", "sms", "push"] as const).map((channel) => (
              <label
                key={channel}
                htmlFor={`notif-${channel}`}
                className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm text-slate-700"
              >
                <span className="capitalize">{channel} notifications</span>
                <input
                  id={`notif-${channel}`}
                  type="checkbox"
                  checked={values.notificationPreferences[channel]}
                  onChange={(e) => updateNotification(channel, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/40"
                />
              </label>
            ))}
          </div>
          {fieldErrors?.notificationPreferences && (
            <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.notificationPreferences.join(" ")}</p>
          )}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !dirty}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              Saving…
            </>
          ) : (
            "Save settings"
          )}
        </button>
        {!dirty && !saving && <span className="text-sm text-slate-500">No unsaved changes</span>}
        {dirty && !saving && <span className="text-sm font-medium text-amber-600">Unsaved changes</span>}
      </div>
    </form>
  );
}
