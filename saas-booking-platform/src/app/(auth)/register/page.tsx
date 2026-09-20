import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Join your organization
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your organization&rsquo;s subdomain to create your account.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 transition-colors hover:text-indigo-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
