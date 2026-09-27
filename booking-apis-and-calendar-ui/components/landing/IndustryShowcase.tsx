"use client";

import React, { useState } from "react";
import {
  Stethoscope,
  Scissors,
  Briefcase,
  Dumbbell,
  Compass,
  CheckCircle2,
} from "lucide-react";

export function IndustryShowcase() {
  const industries = [
    {
      id: "clinics",
      label: "Clinics & Healthcare",
      icon: Stethoscope,
      title: "Medical Practices, Therapy & Wellness Centers",
      description:
        "Manage patient consultations, therapy sessions, follow-up evaluations, and baseline checkups with zero overlapping double-bookings and clear intake notes.",
      points: [
        "Specialized appointment lengths (30m, 45m, 60m)",
        "Secure customer history & intake documentation",
        "Multiple provider / staff roster management",
      ],
      sampleTenant: "Acme Wellness Clinic",
    },
    {
      id: "consultants",
      label: "Consultants & Agencies",
      icon: Briefcase,
      title: "Strategy Advisory, Creative & Design Sprints",
      description:
        "Streamline client discovery workshops, design reviews, and retainer strategy sessions without back-and-forth email scheduling headaches.",
      points: [
        "Timezone-aware client booking links",
        "Automated booking confirmation metadata",
        "Custom billing fee tracking per engagement",
      ],
      sampleTenant: "Lumina Creative Studio",
    },
    {
      id: "fitness",
      label: "Fitness & Studios",
      icon: Dumbbell,
      title: "Personal Trainers, Athletic Labs & Studios",
      description:
        "Organize 1-on-1 athletic coaching, VO2 max testing, conditioning blocks, and private gym slots with rapid mobile-ready day view scheduling.",
      points: [
        "Early morning to late evening operating hours",
        "Immediate cancellation slot recovery",
        "Fast customer attendance records",
      ],
      sampleTenant: "Apex Performance Lab",
    },
    {
      id: "salons",
      label: "Salons & Spas",
      icon: Scissors,
      title: "Stylists, Estheticians & Body Care",
      description:
        "Coordinate multi-chair beauty services, haircuts, color treatments, and spa appointments with precise duration controls.",
      points: [
        "Visual appointment color coding by service",
        "Direct SMS/email contact quick links",
        "No-show reduction with confirmed statuses",
      ],
      sampleTenant: "Aura Beauty Lounge",
    },
    {
      id: "agencies",
      label: "Freelancers & Solopreneurs",
      icon: Compass,
      title: "Independent Contractors & Advisors",
      description:
        "A lightweight, professional booking workspace that replaces cumbersome manual spreadsheets and gives clients an executive impression.",
      points: [
        "Zero-bloat fast client intake",
        "Direct calendar export (CSV)",
        "Works smoothly on any smartphone or tablet",
      ],
      sampleTenant: "Vance Consulting Group",
    },
  ];

  const [activeTab, setActiveTab] = useState(industries[0].id);
  const activeIndustry = industries.find((i) => i.id === activeTab) || industries[0];

  return (
    <section id="industries" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Tailored Workflows
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Designed for Modern Service Businesses
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Whether running a multi-specialist clinic, a boutique agency, or a personal fitness studio, Schedulr adapts seamlessly to your operational rhythm.
          </p>
        </div>

        {/* Industry Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
          {industries.map((ind) => {
            const Icon = ind.icon;
            const isSelected = activeTab === ind.id;
            return (
              <button
                key={ind.id}
                onClick={() => setActiveTab(ind.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{ind.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Detail Card */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-4">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Industry Solution
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {activeIndustry.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeIndustry.description}
              </p>
              <div className="space-y-2 pt-2">
                {activeIndustry.points.map((pt) => (
                  <div key={pt} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Pre-configured Workspace
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {activeIndustry.sampleTenant}
              </p>
              <p className="text-xs text-slate-500">
                Loaded with live appointment presets and sample customers in the demo workspace.
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-2"
              >
                Open Demo Workspace →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
