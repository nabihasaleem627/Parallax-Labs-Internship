"use client";

import { useMemo, useRef, useState } from "react";
import type { TenantSettingsDTO } from "@/lib/tenant-settings-types";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const LOCALES: { value: string; label: string }[] = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "de-DE", label: "German (Germany)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja-JP", label: "Japanese (Japan)" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
];

type FormState = {
  workspaceName: string;
  workspaceDescription: string;
  timezone: string;
  locale: string;
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  notifyEmailUpdates: boolean;
  notifyProjectActivity: boolean;
  notifyWeeklyDigest: boolean;
};

function toFormState(dto: TenantSettingsDTO): FormState {
  return {
    workspaceName: dto.workspaceName,
    workspaceDescription: dto.workspaceDescription,
    timezone: dto.timezone,
    locale: dto.locale,
    theme: dto.theme,
    density: dto.density,
    notifyEmailUpdates: dto.notifyEmailUpdates,
    notifyProjectActivity: dto.notifyProjectActivity,
    notifyWeeklyDigest: dto.notifyWeeklyDigest,
  };
}

function statesEqual(a: FormState, b: FormState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

type Banner = { kind: "success" | "error"; message: string } | null;

export function SettingsForm({
  initialSettings,
  initialSource,
  canEdit,
}: {
  initialSettings: TenantSettingsDTO;
  initialSource: "cache" | "database";
  canEdit: boolean;
}) {
  const [savedSettings, setSavedSettings] = useState<TenantSettingsDTO>(initialSettings);
  const [form, setForm] = useState<FormState>(() => toFormState(initialSettings));
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [lastSource, setLastSource] = useState(initialSource);
  const submittingRef = useRef(false);

  const dirty = useMemo(() => !statesEqual(form, toFormState(savedSettings)), [form, savedSettings]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetChanges() {
    setForm(toFormState(savedSettings));
    setFieldErrors({});
    setBanner(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current || !dirty || !canEdit) return;
    submittingRef.current = true;
    setSaving(true);
    setBanner(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFieldErrors(data.details || {});
        setBanner({ kind: "error", message: data.error || "Unable to save settings. Please try again." });
        return;
      }

      setSavedSettings(data.settings);
      setForm(toFormState(data.settings));
      setLastSource("database");
      setBanner({
        kind: "success",
        message: data.cacheInvalidated
          ? "Settings saved and cache refreshed successfully."
          : "Settings saved to the database. Cache refresh was skipped because Redis is currently unavailable.",
      });
    } catch {
      setBanner({ kind: "error", message: "Network error while saving settings. Please try again." });
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!canEdit && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          You have read-only access to tenant settings. Ask a workspace owner or admin to make changes.
        </div>
      )}

      {banner && (
        <div
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm ${
            banner.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          {banner.message}
        </div>
      )}

      <SectionCard
        title="General"
        description="Basic workspace identity shown across ProjectHive."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Workspace name"
            value={form.workspaceName}
            onChange={(v) => update("workspaceName", v)}
            errors={fieldErrors.workspaceName}
            disabled={!canEdit}
          />
          <SelectField
            label="Time zone"
            value={form.timezone}
            onChange={(v) => update("timezone", v)}
            options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
            errors={fieldErrors.timezone}
            disabled={!canEdit}
          />
        </div>
        <TextAreaField
          label="Workspace description"
          value={form.workspaceDescription}
          onChange={(v) => update("workspaceDescription", v)}
          errors={fieldErrors.workspaceDescription}
          disabled={!canEdit}
        />
        <SelectField
          label="Locale"
          value={form.locale}
          onChange={(v) => update("locale", v)}
          options={LOCALES}
          errors={fieldErrors.locale}
          disabled={!canEdit}
        />
      </SectionCard>

      <SectionCard title="Appearance" description="Default display preferences recorded for this workspace.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Interface theme"
            value={form.theme}
            onChange={(v) => update("theme", v as FormState["theme"])}
            options={[
              { value: "system", label: "Match system" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            errors={fieldErrors.theme}
            disabled={!canEdit}
          />
          <SelectField
            label="Dashboard density"
            value={form.density}
            onChange={(v) => update("density", v as FormState["density"])}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
            errors={fieldErrors.density}
            disabled={!canEdit}
          />
        </div>
      </SectionCard>

      <SectionCard title="Notifications" description="Control which updates your workspace receives.">
        <ToggleRow
          label="Email updates"
          description="Receive important account and billing emails."
          checked={form.notifyEmailUpdates}
          onChange={(v) => update("notifyEmailUpdates", v)}
          disabled={!canEdit}
        />
        <ToggleRow
          label="Project activity"
          description="Get notified when projects are created or updated."
          checked={form.notifyProjectActivity}
          onChange={(v) => update("notifyProjectActivity", v)}
          disabled={!canEdit}
        />
        <ToggleRow
          label="Weekly digest"
          description="A weekly summary of workspace activity."
          checked={form.notifyWeeklyDigest}
          onChange={(v) => update("notifyWeeklyDigest", v)}
          disabled={!canEdit}
        />
      </SectionCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p>
            Last saved: <span className="font-medium text-slate-700 dark:text-slate-200">{new Date(savedSettings.updatedAt).toLocaleString()}</span>
          </p>
          <p className="mt-0.5">
            Retrieved from: <span className="font-medium capitalize text-slate-700 dark:text-slate-200">{lastSource === "cache" ? "Redis cache" : "Database"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetChanges}
            disabled={!dirty || saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={!dirty || saving || !canEdit}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Spinner />}
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  errors,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  errors?: string[];
  disabled?: boolean;
}) {
  const hasError = Boolean(errors?.length);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={hasError}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900 ${
          hasError ? "border-rose-400" : "border-slate-300 focus:border-indigo-500 dark:border-slate-700"
        }`}
      />
      {hasError && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors![0]}</p>}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  errors,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  errors?: string[];
  disabled?: boolean;
}) {
  const hasError = Boolean(errors?.length);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <textarea
        value={value}
        disabled={disabled}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={hasError}
        className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900 ${
          hasError ? "border-rose-400" : "border-slate-300 focus:border-indigo-500 dark:border-slate-700"
        }`}
      />
      {hasError && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors![0]}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  errors,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  errors?: string[];
  disabled?: boolean;
}) {
  const hasError = Boolean(errors?.length);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900 ${
          hasError ? "border-rose-400" : "border-slate-300 focus:border-indigo-500 dark:border-slate-700"
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasError && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors![0]}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
