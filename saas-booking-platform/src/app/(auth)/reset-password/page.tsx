import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ token?: string }> }>) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Choose a new password
          </h1>
        </div>
        <Alert tone="error" title="Missing reset token">
          This reset link is incomplete. Please request a new one from the{" "}
          <Link href="/forgot-password" className="font-medium underline underline-offset-2">
            forgot password page
          </Link>
          .
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Choose a new password
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick a strong password you don&rsquo;t use anywhere else.
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
