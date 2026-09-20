import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/ui/logo";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata: Metadata = {
  title: "Create your organization",
  description: "Set up your organization's isolated Bookflow workspace.",
};

export default function OnboardingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl"
      />
      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/">
          <Brand />
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          Already have an account? Sign in
        </Link>
      </header>

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              Organization setup
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Create your organization
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Your organization gets its own isolated workspace — users, bookings, and
              settings that no other organization can see.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <OnboardingForm />
          </div>
        </div>
      </main>
    </div>
  );
}
