"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { loginSchema } from "@/lib/validation/schemas";
import { flattenFieldErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/lib/api";

export function LoginForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
      rememberMe: form.get("rememberMe") === "on",
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
      const response = await fetch("/api/auth/login", {
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
        label="Email"
        name="email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={fieldErrors.password}
      />
      <div>
        <Checkbox
          label="Remember me for 7 days"
          name="rememberMe"
          defaultChecked={false}
          error={fieldErrors.rememberMe}
        />
      </div>
      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
