"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { onboardingSchema } from "@/lib/validation/schemas";
import { flattenFieldErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/lib/api";

export function OnboardingForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const form = new FormData(event.currentTarget);
    const parsed = onboardingSchema.safeParse({
      organizationName: form.get("organizationName"),
      subdomain: form.get("subdomain"),
      adminName: form.get("adminName"),
      email: form.get("email"),
      password: form.get("password"),
      confirmPassword: form.get("confirmPassword"),
      acceptTerms: form.get("acceptTerms") === "on",
    });

    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))
      );
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json().catch(() => null)) as {
        error?: string;
        fieldErrors?: FieldErrors;
      } | null;
      if (!response.ok) {
        setServerError(json?.error ?? "Something went wrong. Please try again.");
        setFieldErrors(flattenFieldErrors(json?.fieldErrors));
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && <Alert tone="error">{serverError}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Organization name"
          name="organizationName"
          placeholder="Acme Consulting"
          error={fieldErrors.organizationName}
        />
        <div className="space-y-1.5">
          <label htmlFor="subdomain" className="block text-sm font-medium text-slate-700">
            Subdomain
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
            <input
              id="subdomain"
              name="subdomain"
              placeholder="acme"
              autoComplete="off"
              aria-invalid={fieldErrors.subdomain ? true : undefined}
              className="h-10 w-full rounded-l-lg border-0 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <span className="flex h-10 shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
              .bookflow.app
            </span>
          </div>
          {fieldErrors.subdomain ? (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.subdomain}</p>
          ) : (
            <p className="text-xs text-slate-500">This becomes your workspace URL.</p>
          )}
        </div>
      </div>

      <Input
        label="Your name (organization admin)"
        name="adminName"
        placeholder="Jane Cooper"
        autoComplete="name"
        error={fieldErrors.adminName}
      />
      <Input
        label="Work email"
        name="email"
        type="email"
        placeholder="jane@acme.com"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={fieldErrors.password}
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />
      </div>

      <div className="pt-1">
        <Checkbox
          label={
            <>
              I agree to the{" "}
              <a href="/terms" className="font-medium text-indigo-600 underline underline-offset-2">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/terms#privacy" className="font-medium text-indigo-600 underline underline-offset-2">
                Privacy Policy
              </a>
            </>
          }
          name="acceptTerms"
          error={fieldErrors.acceptTerms}
        />
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full">
        {loading ? "Creating your organization…" : "Create organization"}
      </Button>
    </form>
  );
}
