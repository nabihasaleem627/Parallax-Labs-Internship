import React from "react";
import {
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  Users,
  ShieldAlert,
  Lock,
  Layers,
  Code2,
  Smartphone,
} from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      title: "Smart Booking Management",
      description:
        "Create, edit, reschedule, or cancel bookings effortlessly. Form inputs are validated with strict schema controls to ensure consistent data.",
      icon: CalendarCheck,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50",
      border: "border-indigo-100 dark:border-indigo-900/50",
    },
    {
      title: "Responsive Calendar",
      description:
        "Switch seamlessly between Month, Week, Day, and Agenda views. Touch targets and responsive grids adapt smoothly from smartphones to widescreen monitors.",
      icon: CalendarDays,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/50",
      border: "border-sky-100 dark:border-sky-900/50",
    },
    {
      title: "Real-Time Booking Overview",
      description:
        "Track total volume, today's schedule, upcoming appointments, and freed cancellation slots calculated live from your PostgreSQL database.",
      icon: LayoutDashboard,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      border: "border-emerald-100 dark:border-emerald-900/50",
    },
    {
      title: "Customer Management",
      description:
        "Centralized directory indexing customer contact details, appointment histories, intake notes, and lifetime booking activity automatically.",
      icon: Users,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/50",
      border: "border-violet-100 dark:border-violet-900/50",
    },
    {
      title: "Double-Booking Prevention",
      description:
        "Atomic conflict detection blocks overlapping reservations across active appointments. Contiguous time slots remain permitted without false alarms.",
      icon: ShieldAlert,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/50",
      border: "border-rose-100 dark:border-rose-900/50",
    },
    {
      title: "Idempotency Protection",
      description:
        "Database-backed Idempotency-Key headers prevent duplicate bookings from network retries, connection drops, or rapid double-clicks.",
      icon: Lock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
      border: "border-amber-100 dark:border-amber-900/50",
    },
    {
      title: "Multi-Tenant Architecture",
      description:
        "Organizations operate in isolated tenant spaces. Strict data scoping prevents any tenant from viewing or mutating another organization's bookings.",
      icon: Layers,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/50",
      border: "border-cyan-100 dark:border-cyan-900/50",
    },
    {
      title: "Reliable REST API",
      description:
        "Standardized JSON error structures, Zod server-side validation, health probes, and complete Postman collections for rapid developer integration.",
      icon: Code2,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
      border: "border-blue-100 dark:border-blue-900/50",
    },
    {
      title: "Mobile-Friendly Dashboard",
      description:
        "Optimized day drawers, touch-friendly dialogs, and adaptive list views ensure full operational control without horizontal overflow on mobile devices.",
      icon: Smartphone,
      color: "text-fuchsia-600 dark:text-fuchsia-400",
      bg: "bg-fuchsia-50 dark:bg-fuchsia-950/50",
      border: "border-fuchsia-100 dark:border-fuchsia-900/50",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Engineered For Reliability
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything your business needs to manage appointments.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Built from the ground up for commercial service providers, avoiding unnecessary complexity while delivering rock-solid scheduling integrity.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.bg} ${f.border} border mb-4 shrink-0 transition-transform group-hover:scale-105`}
                >
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
