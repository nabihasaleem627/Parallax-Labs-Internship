import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we&rsquo;ll prepare a secure reset link.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-slate-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-indigo-600 transition-colors hover:text-indigo-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
