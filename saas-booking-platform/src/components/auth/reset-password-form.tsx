"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { flattenFieldErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/lib/api";

export function ResetPasswordForm({ token }: { token: string }) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const form = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      token,
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
      const response = await fetch("/api/auth/reset-password", {
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
      setSuccess(true);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title="Password updated">
          Your password has been changed. You can now sign in with your new password.
        </Alert>
        <Button className="w-full" onClick={() => window.location.assign("/login")}>
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && <Alert tone="error">{serverError}</Alert>}
      <input type="hidden" name="token" value={token} />
      <Input
        label="New password"
        name="password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        error={fieldErrors.password}
      />
      <Input
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        placeholder="Repeat your new password"
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
      />
      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
