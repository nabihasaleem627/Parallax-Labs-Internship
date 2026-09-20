"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { registerSchema } from "@/lib/validation/schemas";
import { flattenFieldErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/lib/api";

export function RegisterForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const form = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      organizationSubdomain: form.get("organizationSubdomain"),
      password: form.get("password"),
      confirmPassword: form.get("confirmPassword"),
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
      const response = await fetch("/api/auth/register", {
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
      <Input
        label="Full name"
        name="fullName"
        placeholder="Jane Cooper"
        autoComplete="name"
        error={fieldErrors.fullName}
      />
      <Input
        label="Work email"
        name="email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <div className="space-y-1.5">
        <label htmlFor="organizationSubdomain" className="block text-sm font-medium text-slate-700">
          Organization subdomain
        </label>
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
          <input
            id="organizationSubdomain"
            name="organizationSubdomain"
            placeholder="acme"
            autoComplete="off"
            className="h-10 w-full rounded-l-lg border-0 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            aria-describedby="subdomain-hint"
          />
          <span className="flex h-10 shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
            .bookflow.app
          </span>
        </div>
        {fieldErrors.organizationSubdomain ? (
          <p className="text-xs font-medium text-rose-600">{fieldErrors.organizationSubdomain}</p>
        ) : (
          <p id="subdomain-hint" className="text-xs text-slate-500">
            Ask your organization admin for your subdomain.
          </p>
        )}
      </div>
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
      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
