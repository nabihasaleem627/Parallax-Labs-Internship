import Link from "next/link";
import { Brand } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  ShieldIcon,
  UsersIcon,
  CalendarIcon,
  LockIcon,
} from "@/components/ui/icons";

const features = [
  {
    icon: <ShieldIcon className="h-5 w-5" />,
    title: "Tenant isolation by design",
    description:
      "PostgreSQL Row-Level Security scopes every query to your organization at the database level — not just in the UI.",
  },
  {
    icon: <UsersIcon className="h-5 w-5" />,
    title: "Role-based access",
    description:
      "Organization admins, staff, and members each see exactly what their role allows — nothing more, nothing less.",
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    title: "Bookings & calendar",
    description:
      "Create, confirm, and cancel bookings with a shared calendar view for your whole organization.",
  },
  {
    icon: <LockIcon className="h-5 w-5" />,
    title: "Secure by default",
    description:
      "Hashed passwords, signed short-lived sessions, validated input on both client and server, and zero hard-coded secrets.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create your organization",
    description: "Pick a subdomain, add an admin, and your isolated workspace is ready.",
  },
  {
    step: "02",
    title: "Invite your team",
    description: "Members join with your organization subdomain and get the right role.",
  },
  {
    step: "03",
    title: "Manage bookings",
    description: "Plan, confirm, and track bookings across your organization in one place.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Brand />
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Sign in
          </Link>
          <Link
            href="/onboarding"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              Multi-tenant SaaS · Secure by design
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              The booking workspace for{" "}
              <span className="text-indigo-600">modern organizations</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Bookflow gives every organization its own isolated space to manage
              users, bookings, and calendars — with security enforced at the
              database, not just the interface.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/onboarding" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Create your organization
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/60">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Up and running in minutes
            </h2>
            <p className="mt-3 text-slate-600">
              Three steps between you and an organized booking workflow.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="text-sm font-semibold text-indigo-600">{item.step}</span>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 bg-slate-900">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to organize your bookings?
            </h2>
            <p className="max-w-md text-slate-400">
              Create your organization and see tenant isolation in action.
            </p>
            <Link href="/onboarding">
              <Button size="lg">Get started free</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Bookflow. All rights reserved.</span>
          <span>Built with Next.js, Prisma &amp; PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}
