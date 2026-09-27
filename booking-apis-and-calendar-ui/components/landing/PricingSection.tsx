import React from "react";
import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PricingSection() {
  const tiers = [
    {
      name: "Starter",
      price: "$29",
      cadence: "/month",
      description: "Ideal for individual consultants, solo practitioners, and freelancers.",
      features: [
        "Up to 250 bookings / month",
        "1 Tenant Workspace",
        "Responsive Calendar & Agenda Views",
        "Zod Schema Validation",
        "Email Notifications",
        "Community Support",
      ],
      cta: "Start Starter Plan",
      popular: false,
    },
    {
      name: "Professional",
      price: "$79",
      cadence: "/month",
      description: "For growing clinics, studios, salons, and agency teams.",
      features: [
        "Unlimited Monthly Bookings",
        "Up to 5 Team Member Seats",
        "Conflict Prevention Engine",
        "Database-Backed Idempotency Keys",
        "Customer Directory & Notes",
        "CSV Data Export",
        "Priority Support",
      ],
      cta: "Start 14-Day Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$199",
      cadence: "/month",
      description: "For multi-location practices and high-volume appointment organizations.",
      features: [
        "Multi-Tenant Isolation & Multiple Slugs",
        "Unlimited Staff & Service Categories",
        "Full REST API & Postman Integration",
        "99.99% Uptime SLA",
        "Custom Timezone Rules",
        "Dedicated Account Engineer",
      ],
      cta: "Contact Enterprise Sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Straightforward plans for every business size
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            All plans include atomic conflict prevention, real-time database syncing, and mobile-friendly calendar dashboards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all relative ${
                tier.popular
                  ? "bg-white dark:bg-slate-900 border-2 border-indigo-600 shadow-xl"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {tier.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                  {tier.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs text-slate-500">{tier.cadence}</span>
                </div>

                <div className="mt-8 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Included Features
                  </span>
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6">
                <Link href="/dashboard" className="w-full block">
                  <Button
                    variant={tier.popular ? "primary" : "outline"}
                    className="w-full font-semibold text-xs"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
