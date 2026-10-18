"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Mode = "login" | "signup";

interface FieldErrors {
  [key: string]: string[] | undefined;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload =
      mode === "signup"
        ? {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
            workspaceName: form.get("workspaceName"),
          }
        : {
            email: form.get("email"),
            password: form.get("password"),
          };

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFormError(data.error || "Something went wrong. Please try again.");
        setFieldErrors(data.details || {});
        setSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <Link href="/" className="mx-auto mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          PH
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          {mode === "login" ? "Sign in to ProjectHive" : "Create your workspace"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {mode === "login" ? "Welcome back. Enter your credentials to continue." : "Set up a new tenant workspace in seconds."}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {formError && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {formError}
          </div>
        )}

        {mode === "signup" && (
          <Field label="Full name" name="name" type="text" autoComplete="name" errors={fieldErrors.name} />
        )}
        {mode === "signup" && (
          <Field label="Workspace name" name="workspaceName" type="text" autoComplete="organization" errors={fieldErrors.workspaceName} placeholder="Acme Inc." />
        )}
        <Field label="Email" name="email" type="email" autoComplete="email" errors={fieldErrors.email} />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          errors={fieldErrors.password}
        />

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting && <Spinner />}
          {mode === "login" ? "Sign in" : "Create workspace"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        {mode === "login" ? (
          <>
            Need a workspace?{" "}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  errors,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  errors?: string[];
  placeholder?: string;
}) {
  const hasError = Boolean(errors && errors.length > 0);
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-950 dark:text-white ${
          hasError
            ? "border-rose-400 focus:border-rose-500"
            : "border-slate-300 focus:border-indigo-500 dark:border-slate-700"
        }`}
      />
      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-xs text-rose-600 dark:text-rose-400">
          {errors![0]}
        </p>
      )}
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
