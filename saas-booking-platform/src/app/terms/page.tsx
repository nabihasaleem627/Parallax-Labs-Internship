import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Terms of Service" };

const sections: Array<{ id: string; title: string; body: string[] }> = [
  {
    id: "terms",
    title: "1. Acceptance of terms",
    body: [
      "By creating an organization or account on Bookflow, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.",
    ],
  },
  {
    id: "service",
    title: "2. The service",
    body: [
      "Bookflow provides a multi-tenant booking management workspace. Each organization operates inside an isolated environment and is responsible for the data it adds and the actions of its members.",
    ],
  },
  {
    id: "accounts",
    title: "3. Accounts and security",
    body: [
      "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Passwords are stored only as salted hashes.",
    ],
  },
  {
    id: "privacy",
    title: "4. Privacy",
    body: [
      "We collect only the information necessary to operate the service: your name, work email, and the organization data you create. We never sell personal data. In this Week 1 build, email notifications are not yet delivered; no data leaves the platform except to your configured database.",
    ],
  },
  {
    id: "termination",
    title: "5. Termination",
    body: [
      "Organization admins may remove members at any time. We may suspend access if the service is used to violate the law or the rights of others.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/">
            <Brand />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: September 2026</p>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="mt-2 text-sm leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
