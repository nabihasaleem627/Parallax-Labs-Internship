"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { forgotPasswordSchema } from "@/lib/validation/schemas";

export function ForgotPasswordForm() {
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const form = new FormData(event.currentTarget);
    const parsed = forgotPasswordSchema.safeParse({ email: form.get("email") });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setFieldError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json().catch(() => null)) as {
        error?: string;
        devResetUrl?: string;
      } | null;
      if (!response.ok) {
        setServerError(json?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      setDevResetUrl(json?.devResetUrl ?? null);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title="Check your email">
          If an account exists for that address, a password reset link has been prepared.
        </Alert>
        {devResetUrl && (
          <Alert tone="info" title="Development shortcut">
            No email provider is configured locally, so here is your reset link:{" "}
            <a href={devResetUrl} className="font-medium underline underline-offset-2">
              Open reset page
            </a>
          </Alert>
        )}
      </div>
    );
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
        error={fieldError ?? undefined}
      />
      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
