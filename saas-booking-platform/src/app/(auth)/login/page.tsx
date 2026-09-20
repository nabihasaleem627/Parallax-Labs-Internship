import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

const demoAccounts = [
  { label: "Org admin", email: "admin@acme.test", role: "Acme Consulting" },
  { label: "Staff", email: "staff@acme.test", role: "Acme Consulting" },
  { label: "Member", email: "user@nova.test", role: "Nova Health" },
];

export default function LoginPage() {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your organization workspace.</p>
      </div>

      <LoginForm />

      <div className="flex items-center justify-between text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          Forgot password?
        </Link>
        <Link
          href="/register"
          className="font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          Create an account
        </Link>
      </div>

      {isDev && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-600">Local demo accounts (seeded)</p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-500">
            {demoAccounts.map((account) => (
              <li key={account.email} className="flex justify-between gap-2">
                <span>
                  {account.label} · {account.role}
                </span>
                <span className="font-mono text-slate-600">{account.email}</span>
              </li>
            ))}
            <li className="pt-1 text-slate-400">Password for all: Password123!</li>
          </ul>
        </div>
      )}
    </div>
  );
}
