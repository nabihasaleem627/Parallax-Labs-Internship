"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header content */}
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Modern Multi-Tenant B2B SaaS Booking Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Manage Every Booking From{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-600 dark:from-indigo-400 dark:to-sky-400">
              One Simple Workspace.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            A full-stack appointment and scheduling platform engineered for service businesses.
            Prevent double-bookings, automate client rosters, and manage multi-tenant calendars through a responsive, reliable interface.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto shadow-md shadow-indigo-600/20 font-semibold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/calendar" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto font-semibold"
                leftIcon={<CalendarDays className="w-4 h-4 text-indigo-600" />}
              >
                View Live Calendar
              </Button>
            </Link>
          </div>

          {/* Core Product Trust Points */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Real Idempotency Keys
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              Conflict-Free Slot Engine
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Prisma & PostgreSQL Scoped
            </span>
          </div>
        </div>

        {/* Dashboard Preview Mockup Card */}
        <div className="mt-12 lg:mt-16 relative mx-auto max-w-5xl rounded-2xl p-2 sm:p-4 bg-slate-900/5 dark:bg-white/5 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xs">
          <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            {/* Window title bar */}
            <div className="h-10 bg-slate-100 dark:bg-slate-800/80 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-500">
                  https://app.schedulr.io/dashboard/calendar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Acme Wellness Clinic (Active)
                </span>
              </div>
            </div>

            {/* Visual Dashboard Interface Graphic */}
            <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
              {/* Stat card row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Bookings</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">128</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Today Scheduled</span>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">6</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Upcoming Week</span>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">24</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Conflict Blocked</span>
                  <p className="text-xl font-bold text-sky-600 dark:text-sky-400">100%</p>
                </div>
              </div>

              {/* Sample Calendar Slots Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Today&apos;s Active Schedule Roster</span>
                  <span className="text-indigo-600 font-semibold cursor-pointer">View Full Calendar →</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <span>09:00 - 10:00 AM</span>
                      <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">CONFIRMED</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">Eleanor Vance</p>
                    <p className="text-xs text-slate-500">Initial Health Consultation</p>
                  </div>

                  <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      <span>11:00 - 12:00 PM</span>
                      <span className="text-[10px] bg-indigo-200/60 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded">CONFIRMED</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">David Kim</p>
                    <p className="text-xs text-slate-500">Physical Therapy Assessment</p>
                  </div>

                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
                      <span>02:30 - 03:00 PM</span>
                      <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">PENDING</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">Sophia Martinez</p>
                    <p className="text-xs text-slate-500">Follow-up Wellness Check</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
